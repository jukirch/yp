/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/ODataUtils",
    "sap/ovp/cards/generic/Component",
    "sap/ovp/cards/v4/generic/Component",
    "sap/fe/navigation/NavigationHandler",
    "sap/ovp/cards/CommonUtils",
    "sap/ovp/cards/PersonalizationUtils",
    "sap/ui/model/Filter",
    "sap/fe/navigation/SelectionVariant",
    "sap/ui/comp/state/UIState",
    "sap/ui/Device",
    "sap/ovp/ui/SmartphoneHeaderToggle",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/odata/ODataMetadata",
    "sap/ui/model/analytics/odata4analytics",
    "sap/ovp/support/lib/CommonMethods",
    "sap/ovp/app/resources",
    "sap/ovp/app/TemplateBaseExtension",
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ovp/app/OVPUtils",
    "sap/ovp/app/ShareUtils",
    "sap/base/security/encodeURL",
    "sap/base/util/ObjectPath",
    "sap/ui/thirdparty/jquery",
    "sap/base/util/merge",
    "sap/ui/fl/apply/api/FlexRuntimeInfoAPI",
    "sap/ui/core/CustomData",
    "sap/ovp/app/OVPLogger",
    "sap/base/util/isEmptyObject",
    "sap/ovp/cards/semanticDateRangeTypeHelper",
    "sap/ovp/placeholder/placeholderHelper",
    "sap/ui/core/Component",
    "sap/ui/base/Event",
    "sap/ui/core/Core",
    "sap/ovp/app/ManageCardsUtils",
    "sap/ovp/handlers/IAppStateHandler",
    "sap/ovp/handlers/SmartFilterbarHandler",
    "sap/ovp/insights/CardProvider"
], function (
    Controller,
    ODataUtils,
    Component,
    ComponentV4,
    NavigationHandler,
    CommonUtils,
    PersonalizationUtils,
    Filter,
    SelectionVariant,
    UIState,
    Device,
    SmartphoneHeaderToggle,
    ODataModel,
    ODataMetadata,
    oData4Analytics,
    CommonMethods,
    OvpResources,
    TemplateBaseExtension,
    ControllerExtension,
    OVPUtils,
    ShareUtils,
    encodeURL,
    ObjectPath,
    jQuery,
    merge,
    FlexRuntimeInfoAPI,
    CustomData,
    OVPLogger,
    isEmptyObject,
    semanticDateRangeTypeHelper,
    placeholderHelper,
    CoreComponent,
    BaseEvent,
    Core,
    ManageCardsUtils,
    IAppStateHandler,
    SmartFilterBarHandler,
    CardProvider
) {
    "use strict";

    // Constants which are used as property names for storing custom filter data
    var oLogger = new OVPLogger("OVP.app.Main");
    var dataPropertyNameCustom = "sap.ovp.app.customData",
        dataPropertyNameExtension = "sap.ovp.app.extensionData",
        oShareMenuActionButton;

    return Controller.extend("sap.ovp.app.Main", {
        // Extensions (Implemented in Extension Controller)
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        //Store custom data in oCustomData
        getCustomAppStateDataExtension: function (oCustomData) { },
        //Appstate will return the same oCustomData
        restoreCustomAppStateDataExtension: function (oCustomData) { },
        //Returns Filter object to be used in filtering
        getCustomFilters: function () { },
        //Returns Custom Action function
        onCustomActionPress: function (sCustomAction) { },
        //Returns Custom Parameters
        onCustomParams: function (sCustomParams) { },
        //Modifies the selection variant to be set to the SFB
        modifyStartupExtension: function (oCustomSelectionVariant) { },
        //method to get custom message and icon for no data and error case
        getCustomMessage: function (oResponse, sCardId) { },
        //default breakout function for dynamic view switch
        onBeforeRebindPageExtension: function () { },

        oRefreshTimer: null, // timer instance for auto refresh
        nRefreshInterval: 0, // auto refresh interval that is being set in the manifest
        filterItemInFocus: null,
        bFinishedCardsCreationProcess: false,

        // Delta Changes
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

        /**
         * Called by applyChange in flexibility.js of layout controls
         * dashboard or easyScan
         *
         * It is called for every change
         * So it will be called multiple times
         * The latest call will have the latest change
         *
         * Across all of main controller, making the incoming delta changes available
         */
        storeIncomingDeltaChanges: function (aCardsInfo) {
            this.deltaCardsInfo = aCardsInfo ? aCardsInfo : [];
        },
        appendIncomingDeltaChange: function (oChange) {
            this.deltaChanges.push(oChange);
        },
        templateBaseExtension: TemplateBaseExtension,
        // Standard Methods
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        onInit: function () {
            // This flag is set if user has delta changes available.
            this.bDeltaChangesEnabled = false;
            this.bResetChartAxisFormatter = false;
            // Array to store incoming delta changes
            this.deltaChanges = [];
            // check if no delta changes and need of migration from variant->delta
            this._initFlexibilityPersonalization();
            this.globalEventBus = Core.getEventBus();
            this.oShareUtils = new ShareUtils(this);
            this.oManageCardsUtils = new ManageCardsUtils(this);
            this.getView()
                .loaded()
                .then(function () {
                    // busy handling for Diagnostics Plugin
                    var oOwnerComponent = this.getOwnerComponent();
                    var oMetaData = oOwnerComponent.getMetadata();
                    if (oOwnerComponent && oMetaData && oMetaData.getManifest()) {
                        // Set component id to allow access to manifest even when app does not load successfully.
                        CommonMethods.setAppComponent(this.getOwnerComponent());
                    }
                    // Application status needs to be handled here to support use cases where Diagnostics Tool gets loaded after the app itself.
                    CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.LOADING);
                    // Publish event on global event bus which will trigger Diagnostics Tool plugin when plugin is loaded.
                    // When plugin is not loaded already, it will check the application status at initialisation.
                    CommonMethods.publishEvent("elements", "ViewRenderingStarted", {});
                    //ushell container comes from FLP, if an app is hosted without FLP
                    //then container will not be available. In such case, all container related
                    //functionality need to be skipped
                    this.oContainer = sap.ushell && sap.ushell.Container;
                    //an array of card IDs used to keep track of the current error cards shown.
                    this.aErrorCards = [];

                    this.oCardsModels = {};
                    this.aFilters = [];
                    /*For storing Batch Requests send status*/
                    this.errorHandlingObject = {
                        atLeastOneRequestSuccess: false,
                        errorLoadingTimeout: {}
                    };
                    this.sPreviousEntityType = "";
                    this.sCurrentEntityType = "";
                    this.oLoadedComponents = {};
                    this.bGlobalFilterLoaded = false;
                    this.bGoButtonPressed = false;
                    this.bSearchButtonPressed = false;
                    this.fnMacroFilterBarLoaded = undefined;
                    this.isInitialLoading = true;
                    this.bLoadDataOnMFBSearch = true;
                    this.isMacroFilterBar;
                    this.bSearchTriggeredManually = false;
                    this.bInitialMacroFilterBarSearch = false;
                    var oUIModel = this.getUIModel();
                    this.bDisableErrorPage = oUIModel && oUIModel.getProperty("/disableErrorPage");
                    this.oNavigationHandler = this.oNavigationHandler || new NavigationHandler(this);
                    this.getLayout().addStyleClass("ovpLayoutElement");
                    /* Appstate*/
                    this.oState = {};
                    this.oState.oSmartFilterbar = this.byId("ovpGlobalFilter");
                    /* Appstate */
                    this._initGlobalFilter();
                    this.oShareUtils.init();
                    CommonUtils.enable(this, this.oNavigationHandler);
                    // Proactively load error card template to make it available for createErrorCard method
                    this._loadCardComponent("sap.ovp.cards.error");
                    oShareMenuActionButton = this.getView().byId("sapOvpShareButton");
                    if (oShareMenuActionButton) {
                        oShareMenuActionButton.attachBrowserEvent("click", function() {
                            this.onShareButtonPress();
                        }.bind(this));
                    }
                }.bind(this)
                );
        },

        /* Function to display a popover providing the following options on clicking of Action button in Page header
         * 1. Send as Email (Share the whole page)
         * 2. Share to Microsoft teams
         * 3. Create Tile on FLP
         */
        onShareButtonPress: function () {
            if (oShareMenuActionButton && oShareMenuActionButton.getVisible() && oShareMenuActionButton.getEnabled()) {
                this.oShareUtils.onShareButtonAvailableAndPressed(oShareMenuActionButton);
            }
        },

        performRecreationOfCard: function (oCard) {
            oCard.settings.baseUrl = this._getBaseUrl();
            this._clearStoredEntities(); //Clear previously temporarily stored entity types
            this._initCardModel(oCard.model);
            oCard = this._getTemplateForChart(oCard);
            this._loadCardComponent(oCard.template);
            this._createModelViewMap(oCard);
            if (oCard.settings.tabs && oCard.settings.selectedKey) {
                var selectedIndex = oCard.settings.selectedKey - 1;
                oCard.settings.measureAggregate = oCard.settings.tabs[selectedIndex].measureAggregate;
            }
            jQuery.when(this.createCard(oCard)).then(
                function () {
                    if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                        var oDashboardUtil = this.getLayout().getDashboardLayoutUtil();
                        if (oDashboardUtil) {
                            var oDashBoardLayoutModel = oDashboardUtil.getDashboardLayoutModel();
                            var oDashboardCard = oDashBoardLayoutModel.getCardById(oCard.id);
                            oDashboardUtil._sizeCard(oDashboardCard);
                            oDashBoardLayoutModel.extractCurrentLayoutVariant();
                        }
                    }
                }.bind(this)
            );
        },

        onExit: function () {
            this.bResetChartAxisFormatter = true;
            var oOvpConfig = this.getOwnerComponent().oOvpConfig;

            if (oOvpConfig && oOvpConfig.bInsightRTEnabled) {
                CardProvider.unregisterProvider(this.getOwnerComponent().getId());
            }
        },

        _getOriginalCardDescriptorById: function (sCardId) {
            if (!sCardId) {
                return null;
            }
            var oComponentContainer = this.getView().byId(sCardId);
            var oComponentInstance = oComponentContainer.getComponentInstance();
            var oComponentData = oComponentInstance.getComponentData();
            var oAppComponent = oComponentData.appComponent;
            return oAppComponent._getOvpCardOriginalConfig(sCardId);
        },

        recreateCard: function (oCardProperties) {
            var sCardId = oCardProperties.cardId;
            var oCard = this._getCardFromManifest(sCardId);
            var oOriginalAppDescriptor = this._getOriginalCardDescriptorById(sCardId);
            if (
                oCard.template == "sap.ovp.cards.charts.analytical" ||
                oCard.template == "sap.ovp.cards.charts.smart.chart" ||
                oCard.template == "sap.ovp.cards.v4.charts.analytical"
            ) {
                oCard.settings.chartAnnotationPath = oCardProperties.chartAnnotationPath;
                //Color palette enablement
                oCard.settings.colorPalette = oCardProperties.colorPalette;
                oCard.settings.bEnableStableColors = oCardProperties.bEnableStableColors;
                if (oCardProperties.navigation) {
                    oCard.settings.navigation = oCardProperties.navigation;
                }
            }
            if (oCardProperties.entitySet) {
                oCard.settings.entitySet = oCardProperties.entitySet;
            }
            oCard.settings.annotationPath = oCardProperties.annotationPath;
            oCard.settings.dynamicSubtitleAnnotationPath = oCardProperties.dynamicSubtitleAnnotationPath;
            oCard.settings.presentationAnnotationPath = oCardProperties.presentationAnnotationPath;
            oCard.settings.selectionAnnotationPath = oCardProperties.selectionAnnotationPath;
            oCard.settings.selectionPresentationAnnotationPath = oCardProperties.selectionPresentationAnnotationPath;
            oCard.settings.kpiAnnotationPath = oCardProperties.kpiAnnotationPath;
            oCard.settings.dataPointAnnotationPath = oCardProperties.dataPointAnnotationPath;
            oCard.settings.identificationAnnotationPath = oCardProperties.identificationAnnotationPath;
            // headerAnnotationPath is a property added to the manifest.json for Qualifier support in HeaderInfo annotations.
            oCard.settings.headerAnnotationPath = oCardProperties.headerAnnotationPath;
            oCard.settings.staticParameters = oOriginalAppDescriptor &&
                oOriginalAppDescriptor.settings &&
                oOriginalAppDescriptor.settings.staticParameters;
            if (oCardProperties.staticParameters) {
                oCard.settings.staticParameters = oCardProperties.staticParameters;
            }
            if (oCardProperties.customParams) {
                oCard.settings.customParams = oCardProperties.customParams;
            }
            var sOldKey = oCard.settings.selectedKey;
            oCard.settings.selectedKey = oCardProperties.selectedKey;
            if (oCard) {
                this.performRecreationOfCard(oCard);
            }
            var oChange = {
                changeType: "viewSwitch",
                content: {
                    cardId: oCardProperties.cardId,
                    selectedKey: oCardProperties.selectedKey,
                    oldKey: sOldKey
                },
                isUserDependent: true
            };
            PersonalizationUtils.savePersonalization(oChange, this.getView());
        },

        recreateRTAClonedCard: function (oCardProperties) {
            var oCard = this._getCardFromManifest(oCardProperties.id);
            if (oCard) {
                oCard.settings = oCardProperties.settings;
                this.performRecreationOfCard(oCard);
            }
        },

        //clarify with UI5 Core: why can view models not be accessed in onInit?
        onBeforeRendering: function () { },

        /**
         *  This method will be called once the request is sent
         */
        onRequestSent: function (oEvent) {
            this.destroyErrorCardsAndReplaceWithOriginal();
        },

        // this method will get called once the request gets completed
        onRequestCompleted: function (oEvent) {
            //if the request is success and no data case then create custom message card
            //else if failure case then create error card
            if (oEvent && oEvent.getParameters() && oEvent.getParameters().success) {
                var oResult = oEvent.getParameters().response &&
                    oEvent.getParameters().response.responseText ? JSON.parse(oEvent.getParameters().response.responseText) : "";
                if (oResult && oResult.d && oResult.d.results && oResult.d.results.length == 0) {
                    this.fVerifyAndSetErrorOrCustomMessageCard(oEvent, true);
                }
            } else if (oEvent && oEvent.getParameters() && oEvent.getParameters().response && oEvent.getParameters().response.statusCode !== 0) {
                this.fVerifyAndSetErrorOrCustomMessageCard(oEvent, false);
            }
        },

        /*
         this method will be called in following cases once the request is completed
         1.in case of error card with or without custom message
         2.to set the custom message in case of no data
         */
        fVerifyAndSetErrorOrCustomMessageCard: function (oReason, bSuccess) {
            var key;
            var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
            for (key in aOrderedCards) {
                var oCardComponentContainer = this.getView().byId(aOrderedCards[key].id);
                var oComponentInstance = oCardComponentContainer && oCardComponentContainer.getComponentInstance();
                var oComponentData = oComponentInstance && oComponentInstance.getComponentData();
                var oCardView = oComponentInstance && oComponentInstance.getRootControl();
                var oCardController = oCardView && oCardView.getController();
                var oCardItemsBinding = oCardController && oCardController.getCardItemsBinding();
                if (oCardItemsBinding && !CommonUtils.isODataV4(oCardController.oView.getModel())) {
                    var sModelUrl = oReason.getParameters().url;
                    var sCustomParams = oCardItemsBinding.sCustomParams;
                    var sFilterParams = oCardItemsBinding.sFilterParams;
                    var sPath = oCardItemsBinding.sPath.replace("/", "");
                    var sRangeParams = oCardItemsBinding.sRangeParams;
                    var bIsInlineMode = oCardItemsBinding.sCountMode && oCardItemsBinding.sCountMode.indexOf("Inline");
                    var sSortParams = oCardItemsBinding.sSortParams;
                    var sServiceUrl = oReason.getSource().sServiceUrl;
                    var oMetadata = oReason.oSource && oReason.oSource.oMetadata;
                    var oEntityType = oCardController.getEntityType();
                    var oFilterBarModel = this.getView().getModel();
                    var oCardModel = oCardController.oView.getModel();
                    var oRelevantFilters = this._getEntityRelevantFilters(oEntityType, this.aFilters, oCardModel, oFilterBarModel);
                    var sFilterInUrl;
                    try {
                        sFilterInUrl = ODataUtils.createFilterParams(oRelevantFilters, oMetadata, oEntityType);
                    } catch (e) {
                        oLogger.error("applying filter on a card which is not valid");
                    }
                    /* Added to handle when both sFilterParams and sFilterInUrl is present */
                    if (sFilterParams && sFilterInUrl) {
                        sFilterParams = '(' + sFilterParams.replaceAll('$filter=', "") + ')';
                        sFilterInUrl = '(' + sFilterInUrl.replaceAll('$filter=', "") + ')';
                        sFilterParams = '$filter=' + sFilterParams + '%20and%20' + sFilterInUrl;
                    }
                    sModelUrl = sModelUrl
                        .split(sPath)
                        .join("")
                        .split(sCustomParams)
                        .join("")
                        .split(sFilterParams)
                        .join("")
                        .split(sRangeParams)
                        .join("")
                        .split(sSortParams)
                        .join("")
                        .split(sServiceUrl)
                        .join("")
                        .split(sFilterInUrl)
                        .join("")
                        .split("?")
                        .join("")
                        .split("&")
                        .join("")
                        .split("/")
                        .join("");

                    if (!bIsInlineMode) {
                        sModelUrl = sModelUrl.split("$inlinecount=allpages").join("");
                    }
                    var sCardId = oComponentData && oComponentData.cardId;
                    var oManifestCard = this._getCardFromManifest(sCardId);
                    //remove string sap-client example sap-client=715
                    if (sModelUrl) {
                        var sPattern = /sap-client=[0-9][0-9][0-9]/i;
                        sModelUrl = sModelUrl.replace(sPattern, "");
                    }
                    if (oManifestCard && !sModelUrl) {
                        var oResponseCopy = merge({}, oReason);
                        var oCardCopy = merge({}, oManifestCard);
                        var oMessage = this.getCustomMessage(oResponseCopy, oCardCopy.id);
                        // if custom message is provided then show that message else default no data
                        oMessage = oMessage && typeof oMessage === "object" ? oMessage : "";
                        if (bSuccess && !oMessage) {
                            return;
                        }
                        if (oMessage) {
                            if (bSuccess && oMessage.hasOwnProperty("sMessage") && oMessage.sMessage && typeof oMessage.sMessage === "string") {
                                oReason.getParameters().response.statusText = oMessage.sMessage;
                                if (oMessage.hasOwnProperty("sIcon") && oMessage.sIcon && typeof oMessage.sIcon === "string" && oMessage.sIcon.indexOf("sap-icon") !== -1) {
                                    oReason.getParameters().response.sIcon = oMessage.sIcon;
                                }
                            } else if (!bSuccess && oMessage.hasOwnProperty("sMessage") && oMessage.sMessage && typeof oMessage.sMessage === "string") {
                                oReason.getParameters().response.statusText = oMessage.sMessage;
                            }
                        }
                        if (this.aErrorCards.indexOf(sCardId) == -1) {
                            this.aErrorCards.push(oManifestCard.id);
                        } else {
                            oComponentInstance.destroy();
                        }
                        this.createErrorCard(oManifestCard, oReason);
                    }
                }
            }
        },

        onAfterRendering: function () {
            var oUIModel = this.getView().getModel("ui");
            var bLazyRendering = oUIModel.getProperty("/enableLazyRendering") || 
                this.getOwnerComponent().inLazyLoadingTestMode();
            if (bLazyRendering) {
                this.aObservedCards = [];
                this.observeCardSection();
            }
            this.getView().byId("ovpCardPage").addStyleClass('hideOvpCardPage');
            // Application status needs to be handled here to support use cases where Diagnostics Tool gets loaded after the app itself.
            CommonMethods.setApplicationStatus(CommonMethods.mApplicationStatus.RENDERED);
            // When view rendering has finished, publish global event "GetData" at channel "elements".
            CommonMethods.publishEvent("elements", "ViewRendered", {});

            this.oModelViewMap = {};
            IAppStateHandler.oAppStatePromise = null;
            // checking the refresh interval from the manifest and setting it in the global variable
            if (oUIModel.getProperty("/refreshIntervalInMinutes")) {
                this.nRefreshInterval = oUIModel.getProperty("/refreshIntervalInMinutes");
                /*
                 * if the refresh interval is less than 1 : setting it to 1
                 * else setting it as described in the manifest
                 * converting the minutes to milliseconds
                 */
                this.nRefreshInterval = (this.nRefreshInterval <= 1 ? 1 : this.nRefreshInterval) * 60000;
            }

            // error cards
            var oCardsModels = this._getCardsModel();
            var aCardModelArray = [];
            var key;
            for (key in oCardsModels) {
                if (aCardModelArray.indexOf(oCardsModels[key].model) == -1) {
                    aCardModelArray.push(oCardsModels[key].model);
                }
            }
            var oOwnerComponent = this.getOwnerComponent();
            if (oOwnerComponent) {
                for (key in aCardModelArray) {
                    var oCardModel = oOwnerComponent.getModel(aCardModelArray[key]);
                    if (oCardModel && CommonUtils.isODataV4(oCardModel)) {
                        // oCardModel.attachRequestCompleted(this.onRequestCompleted.bind(this));
                        setTimeout(this.destroyErrorCardsAndReplaceWithOriginal.bind(this), 0);
                    } else if (oCardModel) {
                        oCardModel.attachRequestCompleted(this.onRequestCompleted.bind(this));
                        oCardModel.attachRequestSent(this.onRequestSent.bind(this));
                    }
                }
            }
            // error cards

            //make sure we will not initialize more then ones
            if (this.initialized) {
                return;
            }
            this.initialized = true;
            if (this.getMacroFilterBar() !== undefined) {
                placeholderHelper.hidePlaceholder();
                var oMacroFilterBar = this.getMacroFilterBar();
                if (this.getUIModel()) {
                    var bLiveMode = this.getUIModel().getProperty("/enableLiveFilter");
                    var sLoadBehaviour = this.getDataLoadSettings();
                    if (oMacroFilterBar && !bLiveMode && sLoadBehaviour === "ifAnyFilterExist") {
                        this.verifyMacroFilterLoaded(oMacroFilterBar);
                    }
                }
            }   
            Promise.all([
                this.oFlexibilityPersonalizationPromise,
                this.oGlobalFilterLoadedPromise
            ]).then(function () {
                this.isMacroFilterBar = this.getMacroFilterBar() !== undefined;
                this.getView().byId("ovpFilterNotFulfilledPage").setVisible(false);
                this.getView().byId("ovpCardPage").removeStyleClass('hideOvpCardPage');
                this.persistencyVariantLoaded = true;
                var oCard;
                var cardsIntentWithIndex = [],
                    cardsIntent = [];
                this.aManifestOrderedCards = this._getCardArrayAsVariantFormat(this.getLayout().getContent());
                /**
                 * Order flow -
                 * 1. We fetch personalization in oVariant
                 * 2. Remove unauthorized cards from manifest-ordered cards
                 * 3. Merge personalization and get ordered cards
                 * 4. Remove unauthorized cards from ordered cards (only in case of full array delta change)
                 * 5. Organize cards
                 */
                //Check For Authorization
                for (var counter = 0; counter < this.aManifestOrderedCards.length; counter++) {
                    oCard = this._getCardFromManifest(this.aManifestOrderedCards[counter].id);
                    if (oCard && oCard.settings && oCard.settings.requireAppAuthorization) {
                        cardsIntentWithIndex.push({
                            id: oCard.id,
                            cardIntent: oCard.settings.requireAppAuthorization
                        });
                        cardsIntent.push(oCard.settings.requireAppAuthorization);
                    }
                }

                //Merge LREP data
                var aOrderedCards = this._mergeLREPContent(this.aManifestOrderedCards);
                oUIModel.setProperty("/aOrderedCards", aOrderedCards);
                var bCardVisiblity = aOrderedCards.some(function (oCard) {
                    return oCard.visibility;
                });
                this.organizeCards(aOrderedCards);
                jQuery(".ovpWrapper .sapFDynamicPageTitle .sapFDynamicPageTitleMainActionsHasContent").css({ visibility: "visible" });
                if (!bCardVisiblity) {
                    placeholderHelper.hidePlaceholder();
                }
            }.bind(this));

            if (Device.system.phone) {
                SmartphoneHeaderToggle.enable(this);
            }
        },

        organizeCards: function (aOrderedCards) {
            var oCard;
            var aVisibleCards = [];
            var oUIModel = this.getView().getModel("ui");
            var bLazyRendering = oUIModel.getProperty("/enableLazyRendering") || 
                this.getOwnerComponent().inLazyLoadingTestMode();
            this.updateLayoutWithOrderedCards();
            this.updateDashboardLayoutCards(aOrderedCards);
            if (this.isDragAndDropEnabled()) {
                //Don't show Hide Card button when there is no FLP container present
                if (sap.ushell && sap.ushell.Container) {
                    this._initShowHideCardsButton();
                }
            }
            this._clearStoredEntities(); //Clear previously temporarily stored entity types
            aOrderedCards = oUIModel.getProperty("/aOrderedCards");
            for (var i = 0; i < aOrderedCards.length; i++) {
                if (aOrderedCards[i].visibility) {
                    oCard = this._getCardFromManifest(aOrderedCards[i].id);
                    if (oCard) {
                        aVisibleCards.push(oCard);
                    }
                }
            }

            oUIModel.setProperty("/visibleCardCount", aVisibleCards.length);
            oUIModel.setProperty("/renderedCardCount", 0);
            oUIModel.setProperty("/updateView", false);

            if (!bLazyRendering) {
                for (var i = 0; i < aVisibleCards.length; i++) {
                    this._initCardModel(aVisibleCards[i].model);
                    this._loadCardComponent(aVisibleCards[i].template); //Load Card template files
                    this._createModelViewMap(aVisibleCards[i]);
                }
            }

            // In order to add the below css class after second
            // layout rendering which caused by
            // this.updateLayoutWithOrderedCards()
            setTimeout(function () {
                this.getLayout().addStyleClass("ovpLayoutElementShow");
            }.bind(this), 0);

            // Second load each card component and create the
            // card
            // We would like to wait for the loading cards
            // invocation
            var oTabIndexList = this.fGetViewSwitchIndex(aVisibleCards);
            var aCardsCreation = [];
            for (var i = 0, j = 0; j < aVisibleCards.length; i++, j++) {
                // i --> index for ordered cards
                // j --> index for visible cards

                // If some cards are not visible, they will be missing in visible cards, but in same order
                // This causes issue while setting selectedKey as the correct cards are not matched
                // Hence, keep moving ahead by skipping through invisible cards in ordered cards until match is found
                while (aVisibleCards[j].id !== aOrderedCards[i].id) {
                    i++;
                }

                oCard = aVisibleCards[j];

                if (!oCard.settings.title) {
                    oLogger.error("title is mandatory for card ID : " + oCard.id);
                }
                if (oCard.settings.tabs) {
                    var iIndex = 0;
                    var nIndex = oTabIndexList && oTabIndexList.hasOwnProperty(oCard.id) ? oTabIndexList[oCard.id] : "";
                    if (nIndex && typeof nIndex == "number" && nIndex > 0 && nIndex <= oCard.settings.tabs.length) {
                        iIndex = nIndex >= 1 ? nIndex - 1 : nIndex;
                        this.setOrderedCardsSelectedKey(oCard.id, nIndex);
                    } else if (aOrderedCards[i].selectedKey && oCard.settings.tabs.length >= aOrderedCards[i].selectedKey) {
                        iIndex = aOrderedCards[i].selectedKey - 1;
                    }
                    this.initializeTabbedCard(oCard, iIndex);
                }
                oCard = this._getTemplateForChart(oCard);
                this._loadCardComponent(oCard.template);

                oCard.settings.baseUrl = this._getBaseUrl();
                //this._initCardModel(oCard.model);			//Loading shifted before for better performance
                //this._loadCardComponent(oCard.template);	//Loading shifted before for better performance
                if (bLazyRendering) {
                    aCardsCreation.push(this.observeCardSection(oCard));
                } else {
                    aCardsCreation.push(this.createCard(oCard));
                }
            }
            Promise.all(aCardsCreation).then(
                function () {
                    this.bFinishedCardsCreationProcess = true;
                }.bind(this)
            );

            if (this.busyDialog) {
                this.busyDialog.close();
            }
        },

        initializeCardProvider: function() {
            var oUIModel = this.getView().getModel("ui");
            var bUpdateView = oUIModel && oUIModel.getProperty("/updateView");
            var sComponentId = this.getOwnerComponent() && this.getOwnerComponent().getId();

            if (bUpdateView) {
                CardProvider.onViewUpdate(sComponentId);
            } else {
                CardProvider.init(sComponentId);
            }
        },

        /* Function to change the card template to sap.ovp.cards.charts.analytical if chart type is donut
         *  @param object
         *  @private
         * */
        _getTemplateForChart: function (oCard) {
            //All the chart cards will enter this function, only the donut card's template is changed to "sap.ovp.cards.charts.analytical", to use the vizFrame
            if (oCard.template === "sap.ovp.cards.charts.smart.chart") {
                //After the introduction of the smart charts, only donut/time_series charts would continue to use vizFrame i.e, analytical card template
                //Since smart charts do not support others section in donut as of now, we use our existing vizFrame implementation
                var oView = this.getView();
                var oModel = oView.getModel(oCard.model);
                var oMetaModel = oModel.getMetaModel();
                var oEntitySet = oMetaModel.getODataEntitySet(oCard.settings.entitySet);
                var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
                var oChartAnnotation;
                var chartTypeEnum;
                var oCardObject;
                var bTemplateUpdated = false;
                var sPresentationVariantPath;
                //TODO: Check if presentation variant has visualizations. If yes, only then proceed with further validation else directly set the template to analytical
                if (oCard && oCard.settings) {
                    //Priority 1 - Check for kpi annotation, if it has default presentation variant with visualizations, pick the chart anno from the visualizations
                    if (!bTemplateUpdated && oCard.settings.kpiAnnotationPath) {
                        var oKpiAnnotation = oEntityType[oCard.settings.kpiAnnotationPath];
                        sPresentationVariantPath = oKpiAnnotation.Detail.DefaultPresentationVariant && oKpiAnnotation.Detail.DefaultPresentationVariant.Path;
                        if (sPresentationVariantPath) {
                            oCardObject = this._getTemplateForChartFromVisualization(sPresentationVariantPath, oCard, oModel, oEntitySet, oEntityType);
                            bTemplateUpdated = oCardObject.bTemplateUpdated;
                            if (bTemplateUpdated) {
                                //If the template has been updated in the _getTemplateForChartFromVisualization function, do not check for other conditions
                                oCard = oCardObject.oCard;
                                return oCard;
                            }
                        }
                    }
                    if (!bTemplateUpdated && oCard.settings.selectionPresentationAnnotationPath) {
                        //Priority 2 - Check for selectionpresentation annotation, if it has a presentation variant with visualizations, pick the chart anno from the visualizations
                        var oSelectionPresentationVariant = oEntityType[oCard.settings.selectionPresentationAnnotationPath];
                        if (oSelectionPresentationVariant) {
                            sPresentationVariantPath = oSelectionPresentationVariant.PresentationVariant && oSelectionPresentationVariant.PresentationVariant.Path;
                            if (sPresentationVariantPath) {
                                oCardObject = this._getTemplateForChartFromVisualization(sPresentationVariantPath, oCard, oModel, oEntitySet, oEntityType);
                                bTemplateUpdated = oCardObject.bTemplateUpdated;
                                if (bTemplateUpdated) {
                                    //If the template has been updated in the _getTemplateForChartFromVisualization function, do not check for other conditions
                                    oCard = oCardObject.oCard;
                                    return oCard;
                                }
                            }
                        }
                    } //TODO if (!sTemplate && oCard.settings.presentationAnnotationPath){}
                    if (!bTemplateUpdated && oCard.settings.presentationAnnotationPath) {
                        sPresentationVariantPath = oCard.settings.presentationAnnotationPath;
                        oCardObject = this._getTemplateForChartFromVisualization(sPresentationVariantPath, oCard, oModel, oEntitySet, oEntityType);
                        bTemplateUpdated = oCardObject.bTemplateUpdated;
                        if (bTemplateUpdated) {
                            //If the template has been updated in the _getTemplateForChartFromVisualization function, do not check for other conditions
                            oCard = oCardObject.oCard;
                            return oCard;
                        }
                    }
                    if (!bTemplateUpdated && oCard.settings.chartAnnotationPath) {
                        // If the card settings has chartAnnotationPath, get the annotation and check for the chartType directly.
                        oChartAnnotation = oEntityType[oCard.settings.chartAnnotationPath];
                        chartTypeEnum = oChartAnnotation && oChartAnnotation.ChartType && oChartAnnotation.ChartType.EnumMember;
                        if (chartTypeEnum && chartTypeEnum.split("/")[1] === "Donut") {
                            oCard.template = "sap.ovp.cards.charts.analytical";
                        } else {
                            oCard.template = "sap.ovp.cards.charts.smart.chart"; //For all the chart cards except donut and timeseries
                        }
                    }
                }
            }
            return oCard;
        },

        /* Function to get the template of the card from visualizations
         *  @param object
         *  @private
         * */
        _getTemplateForChartFromVisualization: function (sPresentationVariantPath, oCard, oModel, oEntitySet, oEntityType) {
            // The path to the presentationVariant annotation might contain "@" in the beginning, if present remove it
            if (/^@/.test(sPresentationVariantPath)) {
                sPresentationVariantPath = sPresentationVariantPath.slice(1);
            }
            oCard.settings.presentationAnnotationPath = sPresentationVariantPath;
            var aVisualizations = oEntityType[sPresentationVariantPath] && oEntityType[sPresentationVariantPath].Visualizations;
            var index;
            var oChartAnnotation;
            var chartTypeEnum;
            var bTemplateUpdated = false;

            /*
             *   For chartAnnotationPath (Chart) in Visualizations
             * */
            if (aVisualizations && aVisualizations.length > 0) {
                for (index = 0; index < aVisualizations.length; index++) {
                    var sVisualizations = aVisualizations[index].AnnotationPath;
                    if (!sVisualizations) {
                        return {
                            oCard: oCard,
                            bTemplateUpdated: bTemplateUpdated
                        };
                    }
                    sVisualizations.trim(); //Removes spaces in the beginning and the end if any.
                    //The path to any annotation in visualizations might contain "@" in the beginning, if present remove it
                    if (sVisualizations.startsWith("@")) {
                        sVisualizations = sVisualizations.slice(1);
                    }
                    // Check if the annotation present in the visualizations is the chartAnnotation.
                    if (sVisualizations.indexOf("Chart") != -1) {
                        //Update the chartanno path in the card settings
                        oCard.settings.chartAnnotationPath = sVisualizations;
                        oChartAnnotation = oEntityType[sVisualizations];
                        chartTypeEnum = oChartAnnotation && oChartAnnotation.ChartType && oChartAnnotation.ChartType.EnumMember;
                        if (chartTypeEnum && chartTypeEnum.split("/")[1] === "Donut") {
                            oCard.template = "sap.ovp.cards.charts.analytical";
                        } else {
                            oCard.template = "sap.ovp.cards.charts.smart.chart"; //For all the chart cards except donut and timeseries
                        }
                    }
                    bTemplateUpdated = true; //To be used as a flag to indicate that the template has been updated
                }
            }
            return {
                oCard: oCard,
                bTemplateUpdated: bTemplateUpdated
            };
        },

        /* Function to create a model vs view map
         *  @param object
         *  @private
         * */
        _createModelViewMap: function (oCard) {
            //Create model vs view map
            //Each model object contains view id as its property
            if (!oCard || !oCard.settings || !oCard.model) {
                return;
            }
            //For cards with static content, model map is not required
            if (!oCard.settings.entitySet || oCard.settings.entitySet === "") {
                return;
            }
            // For custom cards, model map is not required
            if (!oCard.template.startsWith("sap.ovp.cards")) {
                return;
            }
            var sModelName = oCard.model;
            if (!this.oModelViewMap[sModelName]) {
                this.oModelViewMap[sModelName] = {};
            }
            this.oModelViewMap[sModelName][oCard.id] = true;
        },

        //set tab index for the cards
        setTabIndex: function (oTabIndexList) {
            if (typeof oTabIndexList == "object") {
                this.oTabIndexList = oTabIndexList;
            } else {
                this.oTabIndexList = {};
            }
        },

        //get tab index of the cards
        getTabIndex: function () {
            return this.oTabIndexList;
        },

        /**
         * This function is used to check if the preset filters are applied or not.
         * @param {object} oMacroFilter macro filter bar for which preset filter is checked.
         * @returns {boolean} result of the preset filters are applied or not. 
         * @private
        */
        fnPresetFiltersAppliedInMFB: function(oMacroFilter) {
            var oFilters = oMacroFilter.getFilters();
            if (oFilters && oFilters.filters) {
               return oFilters.filters.length > 0;
            }
            return false;
        },

        /**
         * This function is used to check if apply automatically is enabled or not for the selected variant.
         * @param {array} aVariants Array of all variants.
         * @param {string} sCurrentVariant name of the current variant.
         * @returns {boolean} result if the current variant if it can be executed. 
         * @private
        */
        fnExecuteOnSelectForCurrentVariant: function (aVariants,sCurrentVariant) {
            var oVariantInstance = aVariants.find(function (variant) {
                return variant && variant.key === sCurrentVariant;
            });
            return (oVariantInstance && oVariantInstance.executeOnSelect) || false;
        },

        /**
         * This function is used to determine the dataLoad behaviour for OData V4 for the ifAnyFilterExist scenario.
         * @param {object} oMacroFilter instance of macro filter bar.
         * @private
        */
        verifyMacroFilterLoaded: function (oMacroFilter) {
            var oVariantManagement = this.getView().byId("ovpGlobalMacroFilterVariantMGMT");
            if (oVariantManagement) {
                var sCurrentVariant = oVariantManagement.getCurrentVariantKey();
                var aVariants = oVariantManagement.getVariants();
                var bApplyAutomatically = this.fnExecuteOnSelectForCurrentVariant(aVariants,sCurrentVariant);
                var bPresetFilter = this.fnPresetFiltersAppliedInMFB(oMacroFilter);
                if (bApplyAutomatically && !bPresetFilter) {
                    this.bLoadDataOnMFBSearch = false;
                }
            }
        },
        /**
         * This function is used to provide the dataLoad setting.
         * @returns {string} Result includes dataLoad settings. 
         * @private
        */
        getDataLoadSettings: function () {
            var oUIModel = this.getUIModel();
            var oDataLoadSetting = oUIModel && oUIModel.getProperty("/dataLoadSettings");
            var sLoadBehaviour = oDataLoadSetting ? oDataLoadSetting.loadDataOnAppLaunch : "ifAnyFilterExist";
            if (!["ifAnyFilterExist", "always", "never"].includes(sLoadBehaviour)) {
                oLogger.error("dataLoadSetting is incorrect. It should be one of ifAnyFilterExist,always,never");
            }
            return sLoadBehaviour;
        },

        //call onBeforeRebindPageExtension breakout function with cards and filters
        fGetViewSwitchIndex: function (oCards) {
            var oGlobalFilter = this.getGlobalFilter();
            var oUiState = oGlobalFilter && oGlobalFilter.getUiState();
            //changing the ternary condition here to fix a console error  
            //After navigating to ovp from other application or home page, open manage cards & try to remove or add card without this change it throws a console error
            var sSelectionVariant = oUiState && oUiState.getSelectionVariant() ? JSON.stringify(oUiState.getSelectionVariant()) : "{}";
            var oSelectionVariant = JSON.parse(sSelectionVariant);
            var oSelectionVariantCopy = merge({}, oSelectionVariant);
            var oCardsCopy = [];
            if (oCards && oCards.length > 0) {
                for (var i = 0; i < oCards.length; i++) {
                    var oCard = merge({}, oCards[i]);
                    oCardsCopy.push(oCard);
                }
            }
            this.onBeforeRebindPageExtension(oCardsCopy, oSelectionVariantCopy);
            return this.getTabIndex();
        },

        /*
         * on filter change get all visible cards, call breakout to set tab index
         * if index is diff from the current then recreate card with new index
         * */
        changeViewSwitchForVisibleCard: function () {
            var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
            if (aOrderedCards && aOrderedCards.length > 0) {
                var oCards = [],
                    aProps = [];
                for (var i = 0; i < aOrderedCards.length; i++) {
                    oCards.push(this._getCardFromManifest(aOrderedCards[i].id));
                }
                var oTabIndexList = this.fGetViewSwitchIndex(oCards);
                if (oTabIndexList && typeof oTabIndexList == "object") {
                    aProps = Object.keys(oTabIndexList);
                }
                if (aProps && aProps.length > 0) {
                    for (var i = 0; i < aOrderedCards.length; i++) {
                        if (aOrderedCards[i] && aOrderedCards[i].visibility == true) {
                            //&& aOrderedCards[i].hasOwnProperty("selectedKey")
                            var oCard = this._getCardFromManifest(aOrderedCards[i].id);
                            if (oCard && oCard.settings && oCard.settings.tabs && oCard.settings.hasOwnProperty("selectedKey")) {
                                var nIndex = oTabIndexList && oTabIndexList.hasOwnProperty(oCard.id) ? oTabIndexList[oCard.id] : "";
                                var nCurrentIndex = oCard.settings.selectedKey;
                                if (nIndex && typeof nIndex == "number" && nIndex <= oCard.settings.tabs.length && nIndex !== nCurrentIndex) {
                                    this.setOrderedCardsSelectedKey(oCard.id, nIndex);
                                    var oTabValue = {};
                                    oTabValue = oCard.settings.tabs[nIndex - 1];
                                    var oUpdatedCardProperties = {
                                        cardId: oCard.id,
                                        selectedKey: nIndex
                                    };
                                    for (var prop in oTabValue) {
                                        oUpdatedCardProperties[prop] = oTabValue[prop];
                                    }
                                    this.recreateCard(oUpdatedCardProperties);
                                }
                            }
                        }
                    }
                }
            }
        },

        //set selected tab index of a card in ordered cards
        setOrderedCardsSelectedKey: function (sCardId, nSelectedKey) {
            var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
            for (var i = 0; i < aOrderedCards.length; i++) {
                if (aOrderedCards[i] && aOrderedCards[i].id == sCardId) {
                    aOrderedCards[i].selectedKey = nSelectedKey;
                    break;
                }
            }
            this.getView().getModel("ui").setProperty("/aOrderedCards", aOrderedCards);
        },

        //get selected tab index of a card from ordered cards
        getOrderedCardsSelectedKey: function (sCardId) {
            var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
            for (var i = 0; i < aOrderedCards.length; i++) {
                if (aOrderedCards[i] && aOrderedCards[i].id == sCardId) {
                    return aOrderedCards[i].selectedKey;
                }
            }
        },

        initializeTabbedCard: function (oCard, iIndex) {
            if (
                oCard.template == "sap.ovp.cards.charts.analytical" ||
                oCard.template == "sap.ovp.cards.charts.smart.chart" ||
                oCard.template == "sap.ovp.cards.v4.charts.analytical"
            ) {
                oCard.settings.chartAnnotationPath = oCard.settings.tabs[iIndex].chartAnnotationPath;
                //Color palette enablement
                oCard.settings.colorPalette = oCard.settings.tabs[iIndex].colorPalette;
                oCard.settings.bEnableStableColors = oCard.settings.tabs[iIndex].bEnableStableColors;
                if (oCard.settings.tabs[iIndex].navigation) {
                    oCard.settings.navigation = oCard.settings.tabs[iIndex].navigation;
                }
            }
            if (oCard.settings.tabs[iIndex].entitySet) {
                oCard.settings.entitySet = oCard.settings.tabs[iIndex].entitySet;
            }
            oCard.settings.annotationPath = oCard.settings.tabs[iIndex].annotationPath;
            oCard.settings.dynamicSubtitleAnnotationPath = oCard.settings.tabs[iIndex].dynamicSubtitleAnnotationPath;
            oCard.settings.presentationAnnotationPath = oCard.settings.tabs[iIndex].presentationAnnotationPath;
            oCard.settings.selectionAnnotationPath = oCard.settings.tabs[iIndex].selectionAnnotationPath;
            oCard.settings.selectionPresentationAnnotationPath = oCard.settings.tabs[iIndex].selectionPresentationAnnotationPath;
            oCard.settings.kpiAnnotationPath = oCard.settings.tabs[iIndex].kpiAnnotationPath;
            oCard.settings.dataPointAnnotationPath = oCard.settings.tabs[iIndex].dataPointAnnotationPath;
            oCard.settings.identificationAnnotationPath = oCard.settings.tabs[iIndex].identificationAnnotationPath;
            oCard.settings.params = oCard.settings.tabs[iIndex].params;
            oCard.settings.measureAggregate = oCard.settings.tabs[iIndex].measureAggregate;
            oCard.settings.selectedKey = iIndex + 1;
            if (!oCard.settings.staticParameters) {
                oCard.settings.staticParameters = oCard.settings.tabs[iIndex].staticParameters;
            }
            if (!oCard.settings.customParams) {
                oCard.settings.customParams = oCard.settings.tabs[iIndex].customParams;
            }
        },

        _getLibraryResourceBundle: function () {
            if (!this.oLibraryResourceBundle) {
                this.oLibraryResourceBundle = Core.getLibraryResourceBundle("sap.ovp");
            }
            return this.oLibraryResourceBundle;
        },

        _getOvplibResourceBundle: function () {
            //Resource bundle is already set in owner component
            return this.getOwnerComponent()._getOvpLibResourceBundle();
        },

        _getCardsModel: function () {
            if (!this.oCards) {
                var oUIModel = this.getUIModel();
                this.oCards = oUIModel.getProperty("/cards");
            }
            return this.oCards;
        },

        _getBaseUrl: function () {
            var oUIModel = this.getUIModel();
            if (!this.sBaseUrl) {
                this.sBaseUrl = oUIModel.getProperty("/baseUrl");
            }
            return this.sBaseUrl;
        },

        _getApplicationId: function () {
            var oUIModel = this.getUIModel();
            return oUIModel.getProperty("/applicationId");
        },

        _getCardFromManifest: function (sCardId) {
            var aCards = this._getCardsModel();
            for (var i = 0; i < aCards.length; i++) {
                if (aCards[i].id === sCardId) {
                    return aCards[i];
                }
            }
            if (!sCardId.includes("ObjectStream")) { // skip the manifest check for Object Stream cards
                oLogger.error("Card id " + sCardId + " is not available in the manifest");
            }
            return null;
        },

        _getCardArrayAsVariantFormat: function (aComponentContainerArray) {
            var aCards = [];
            for (var i = 0; i < aComponentContainerArray.length; i++) {
                var sId = this._getCardId(aComponentContainerArray[i].getId());
                aCards.push({
                    id: sId,
                    visibility: aComponentContainerArray[i].getVisible()
                });
                var iSelectedKey;
                if (this.getView() && this.getView().byId) {
                    if (this.getView().byId(sId).getComponentInstance()) {
                        iSelectedKey = this.getView().byId(sId).getComponentInstance().getComponentData().settings.selectedKey;
                    }
                }
                if (iSelectedKey) {
                    aCards[aCards.length - 1].selectedKey = iSelectedKey;
                }
            }
            return aCards;
        },

        /**
         * _mergeLREPContent is called once in first onAfterRendering
         */
        _mergeLREPContent: function (aLayoutCardsArray) {
            var aCards = [];
            var bDeltaArrayPresent = false;
            // if user has a full array of cards available as delta change, should be used instead
            if (this.bDeltaChangesEnabled && Array.isArray(this.deltaCardsInfo) && this.deltaCardsInfo.length > 0) {
                // add cards to full array delta at the end which are missing from manifest cards
                aLayoutCardsArray = PersonalizationUtils.addMissingCardsFromManifest(aLayoutCardsArray, this.deltaCardsInfo);
                bDeltaArrayPresent = true;
            }
            // for dashboard/resizable, we do some extra things
            if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                if (!bDeltaArrayPresent) {
                    aLayoutCardsArray = this.getLayout().getLayoutDataJSON();
                }
                aCards = PersonalizationUtils.mergeChanges(aLayoutCardsArray, this.deltaChanges);
                this._bDashboardLayoutLrepActive = true;
                //update dashboardLayoutModel layout
                this.getLayout().getDashboardLayoutModel().setLayoutVars(aCards);
            } else {
                aCards = PersonalizationUtils.mergeChanges(aLayoutCardsArray, this.deltaChanges);
            }
            return aCards ? aCards : [];
        },

        updateLayoutWithOrderedCards: function () {
            var oLayout = this.getLayout();
            var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
            oLayout.removeAllContent();
            var aCardsManifest,
                matchFound = false;
            if (this.getView().getModel("ui") && this.getView().getModel("ui").getProperty("/cards")) {
                aCardsManifest = this.getView().getModel("ui").getProperty("/cards");
                // Maybe this check could create issues once the RTA is enabled and Key User can Add and Remove cards
                //if (aCardsManifest.length !== aOrderedCards.length) {
                for (var i = 0; i < aCardsManifest.length; i++) {
                    matchFound = false;
                    for (var j = 0; j < aOrderedCards.length; j++) {
                        if (aCardsManifest[i].id == aOrderedCards[j].id) {
                            matchFound = true;
                            break;
                        }
                    }
                    /**In case there are cards in manifest but not displayed on UI due to missing authorization or other reasons then
                     their instance needs to be destroyed else they are recreated with same id's causing duplicate id issue.
                     Here we find such ComponentContainers which are present in manifest but not in displayed cards **/
                    if (!matchFound && this.getView().byId(aCardsManifest[i].id)) {
                        this.getView().byId(aCardsManifest[i].id).destroy();
                    }
                }
            }

            for (var i = 0; i < aOrderedCards.length; i++) {
                var oComponentContainer = this.getView().byId(aOrderedCards[i].id);
                /**
                 * Check if component container exists first before setting visibility.
                 * If manifest cards have been changed after end users have saved personalization, it is possible there are extra cards
                 * in ordererd cards but less cards in manifest. In this case, component container is destroyed already above for mismatched cards.
                 */
                if (oComponentContainer) {
                    oComponentContainer.setVisible(aOrderedCards[i].visibility);
                    oLayout.addContent(oComponentContainer);
                }
            }
        },

        /**
         when a card is hidden, we will have to remove it from the error cards
         as it is no longer part of the displayed cards
         */
        _updateErrorCardsArray: function (aCards) {
            var index;
            for (index = 0; index < aCards.length; index++) {
                var iCardIndex = this.aErrorCards.indexOf(aCards[index].id);
                if (iCardIndex > -1 && aCards[index].visibility == false) {
                    this.aErrorCards.splice(iCardIndex, 1);
                }
            }
        },

        updateDashboardLayoutCards: function (aCards) {
            if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                if (this.getLayout().getDashboardLayoutUtil()) {
                    this.getLayout().getDashboardLayoutUtil().updateCardVisibility(aCards);
                }
            }
        },

        updateCardVisibiltyForCM: function(aCards) {
            var aVisibleCards = aCards.filter(function (oCard) {
                return oCard.visible;
            });
            var oUIModel = this.getView().getModel("ui");
            oUIModel.setProperty("/visibleCardCount", aVisibleCards.length);
            oUIModel.setProperty("/renderedCardCount", 0);
            oUIModel.setProperty("/updateView", true);
            CardProvider.resetInsightCards();

            if (!aVisibleCards.length) {
                CardProvider.onViewUpdate(this.getOwnerComponent().getId());
            }
        },

        resetDashboardLayout: function () {
            if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                if (this.getLayout().getDashboardLayoutUtil()) {
                    this.getLayout().getDashboardLayoutUtil().resetToManifest();
                }
                this.getLayout().invalidate();
            }
        },

        //Method to extract variants of the card for the resizable layout
        _getCardArrayAsVariantFormatDashboard: function () {
            var aCards = [];
            var oLayout = this.getLayout();
            var aCardsArray = oLayout.dashboardLayoutUtil.aCards;
            oLayout.dashboardLayoutUtil.dashboardLayoutModel._sortCardsByRow(aCardsArray);
            aCardsArray.forEach(function (element) {
                aCards.push({
                    id: element.id,
                    visibility: element.dashboardLayout.visible
                });
            });
            return aCards;
        },

        _fnIsLoadDataOnGoButton: function (bGlobalFilterMandatoryItemsFilled) {
            var ovpFilterNotFulfilledPage = this.getView().byId("ovpFilterNotFulfilledPage");
            var bApplyAutomatically;
            ovpFilterNotFulfilledPage.setVisible(true);
            //if the variant is disbaled
            var isSmartVariantEnabled = this.getUIModel().getProperty("/smartVariantRequired");
            if (!isSmartVariantEnabled) {
                placeholderHelper.hidePlaceholder();
                return false;
            }

            var ovpMainPage = this && this.getView().byId("ovpMain");
            //check if variants is not standard then dont take manifest changes
            if (!this.oState.oSmartFilterbar.isCurrentVariantStandard()) {
                bApplyAutomatically = this.oState.oSmartFilterbar.isCurrentVariantExecuteOnSelectEnabled();
                placeholderHelper.hidePlaceholder();
                if (!bApplyAutomatically) {
                    ovpMainPage.setHeaderExpanded(true);
                }
                if (bGlobalFilterMandatoryItemsFilled && !bApplyAutomatically) {
                    ovpFilterNotFulfilledPage.setVisible(false);
                }
                return false;
            }
            var sLoadBehaviour = this.getDataLoadSettings();
            var bDataLoad = false,
                bGlobalFilterItemFilled = true;
            if (sLoadBehaviour === "ifAnyFilterExist") {
                var filtersWithValues = this.oState.oSmartFilterbar.getFiltersWithValues();
                bDataLoad = true;
                bGlobalFilterItemFilled = filtersWithValues.length ? true : false;
            } else if (sLoadBehaviour === "always") {
                bDataLoad = true;
            } else if (sLoadBehaviour === "never") {
                bDataLoad = false;
            }
            if (bDataLoad) {
                var smartVariant = this.oState.oSmartFilterbar.getSmartVariant();
                if (smartVariant) {
                    smartVariant.setExecuteOnStandard(true);
                    bDataLoad = smartVariant.getExecuteOnStandard();
                    bApplyAutomatically = this.oState.oSmartFilterbar.isCurrentVariantExecuteOnSelectEnabled();
                    if (bApplyAutomatically) {
                        this.oState.oSmartFilterbar.search();
                    }
                }
            }
            //to expand header when apply automatically checkbox is unchecked or bDataLoad is false
            if (!bApplyAutomatically || !bDataLoad) {
                ovpMainPage.setHeaderExpanded(true);
            }
            //to hide enter mandatory information text when mandatory fields are filled & apply automatically checkbox is unchecked or bDataLoad is false
            if (bGlobalFilterMandatoryItemsFilled && (!bApplyAutomatically || !bDataLoad)) {
                ovpFilterNotFulfilledPage.setVisible(false);
            }
            OVPUtils.loadingState.GLOBALFILTERFILLED = bDataLoad;
            if (!bDataLoad || !bGlobalFilterMandatoryItemsFilled || !bGlobalFilterItemFilled) {
                placeholderHelper.hidePlaceholder();
            }
            return bDataLoad && bGlobalFilterMandatoryItemsFilled && bGlobalFilterItemFilled;
        },

        verifyGlobalFilterLoaded: function () {
            // Do a manual validation if all the mandatory fields are filled in global filter bar
            // Call search method of SFB if all the mandatory fields in global filter bar are filled.
            // the global filter loaded promise. If false is returned, then promise not resolved.
            var liveMode = this.getUIModel().getProperty("/enableLiveFilter");
            var oGlobalFilter = this.getGlobalFilter();
            var bGlobalFilterMandatoryItemsFilled = true;
            var aMandatoryFilterItems = oGlobalFilter.determineMandatoryFilterItems();
            var oFilterItem,
                oData = oGlobalFilter.getFilterData(),
                oControl;
            if (aMandatoryFilterItems && oData) {
                var filterItemsLength = aMandatoryFilterItems.length;
                while (filterItemsLength--) {
                    oFilterItem = aMandatoryFilterItems[filterItemsLength];
                    oControl = oGlobalFilter.determineControlByFilterItem(oFilterItem, true);
                    if (oControl) {
                        if (!oGlobalFilter._checkForValues(oData, oFilterItem, oControl)) {
                            bGlobalFilterMandatoryItemsFilled = false;
                            break;
                        }
                    }
                }
            }
            if (!this.bGlobalFilterLoaded && liveMode === false) {
                if (!bGlobalFilterMandatoryItemsFilled) {
                    var bMobileDevice = Device && Device.system && Device.system.phone;
                    if (bMobileDevice) {
                        var ovpMainPage = this && this.getView().byId("ovpMain"),
                            bFilterBarExpanded = ovpMainPage && ovpMainPage.getHeaderExpanded();
                        if (!bFilterBarExpanded) {
                            ovpMainPage.setHeaderExpanded(true);
                        }
                    }
                    if (placeholderHelper.hidePlaceholderNeeded()) {
                        placeholderHelper.hidePlaceholder();
                    }
                }
                return this._fnIsLoadDataOnGoButton(bGlobalFilterMandatoryItemsFilled);
            }
            if (bGlobalFilterMandatoryItemsFilled) {
                if (oGlobalFilter.validateMandatoryFields()) {
                    OVPUtils.loadingState.GLOBALFILTERFILLED = true;
                    return true;
                }
            } else if (!bGlobalFilterMandatoryItemsFilled) {
                if (placeholderHelper.hidePlaceholderNeeded()) {
                    placeholderHelper.hidePlaceholder();
                }
            }
            this.getView().byId("ovpMain").setHeaderExpanded(true);
            this.getView().byId("ovpFilterNotFulfilledPage").setVisible(true);
            OVPUtils.loadingState.GLOBALFILTERFILLED = false;
            return false;
        },

        /**
         * Register to the filterChange event of the filter bar in order to mark that
         * one or more of the filters were changed
         */
        onGlobalFilterChange: function (oEvent) {
            this.filterChanged = true;
            //Make layout inactive only after global filter is loaded else this
            //interferes with initial application load during iappstate apply
            if (this.bGlobalFilterInitialized) {
                // when the user enters a filter value and does not click on go
                // there is an inconsistency between the filter values and data shown on
                // the OVP cards, we have an overlay over the OVP cards to signify the same
                var oGlobalFilter = this.getGlobalFilter();
                var bLiveMode = oGlobalFilter.getLiveMode();
                var oOvpLayout = this.getLayout();
                var bFilterDataUpdatedFromSetFilterData = oEvent.getParameter("afterFilterDataUpdate");
                if (!bLiveMode && oOvpLayout && !bFilterDataUpdatedFromSetFilterData) {
                    oOvpLayout.setActive(false);
                } else {
                    oOvpLayout.setActive(true);
                    this.changeViewSwitchForVisibleCard();
                }
            }

            /* Appstate will be created only on filter search triger, so the
             below piece of code is now commented
             var oGlobalFilter = this.getGlobalFilter();
             if (oGlobalFilter && !oGlobalFilter.isDialogOpen()) {
             this._storeCurrentAppStateAndAdjustURL();
             }*/
        },

        destroyErrorCardsAndReplaceWithOriginal: function () {
            // destroy error cards and replace with original only when
            // search is triggered from SFB or the model is automatically refreshed
            // using the refresh interval flag
            if (this.isModelRefreshTriggered || this.filterChanged || this.bGoButtonPressed || this.bSearchButtonPressed) {
                var key;
                var aErrorCardsCopy = Object.assign({}, this.aErrorCards);
                var bLazyRendering = this.getView().getModel("ui").getProperty("/enableLazyRendering") || 
                    this.getOwnerComponent().inLazyLoadingTestMode();
                for (key in aErrorCardsCopy) {
                    var oCardComponentContainer = this.getView().byId(aErrorCardsCopy[key]);
                    var oComponentInstance = oCardComponentContainer && oCardComponentContainer.getComponentInstance();
                    var oComponentData = oComponentInstance && oComponentInstance.getComponentData();
                    var sCardId = oComponentData && oComponentData.cardId;
                    var oManifestCard = this._getCardFromManifest(sCardId);
                    oComponentInstance.destroy();
                    var iCardIndex = this.aErrorCards.indexOf(sCardId);
                    if (iCardIndex > -1) {
                        this.aErrorCards.splice(iCardIndex, 1);
                    }
                    if (bLazyRendering) {
                        this.observeCardSection(oManifestCard);
                    } else {
                        this.createCard(oManifestCard);
                    }
                }
                this.isModelRefreshTriggered = false;
            }
        },

        onTriggerFilterSearch: function () {
            var oGlobalFilter = this.getGlobalFilter();
            if (oGlobalFilter && oGlobalFilter.validateMandatoryFields() && isEmptyObject(oGlobalFilter.verifySearchAllowed())) {
                this.onGlobalFilterSearch();
            }
            if (this.getMacroFilterBar()) {
                this.onMacroFilterBarSearch();
            }
        },

        /**
         * Register to the search event of the filter bar in order to refresh all models
         * with the changes in the filter bar (if there are changes) when "go" is clicked
         */
        onGlobalFilterSearch: function () {
            //If GO button is pressed even without changing filter, then also trigger a search
            if (this.filterChanged || this.bGoButtonPressed || this.bSearchButtonPressed) {
                var oGlobalFilter = this.getGlobalFilter();

                // Scenario 1: user enters basic search, presses the search/go buttons or enter key
                // Scenario 2: user enters value in filter and presses the enter key
                var oOvpLayout = this.getLayout();
                if (oOvpLayout) {
                    oOvpLayout.setActive(true);
                }

                // we do not have a check here to see if the style class is presen
                // removestyleclass does not throw any errors if a given classname is not present
                if (this.aErrorCards && this.aErrorCards.length > 0) {
                    // destroy all error cards and set to actual cards.
                    // since the error cards to not have a model associated with them
                    // when the global filter search is triggered, there is a chance the service might return valid data
                    // in this case we have to set the original card
                    this.destroyErrorCardsAndReplaceWithOriginal();
                }
                if (oGlobalFilter && !oGlobalFilter.isDialogOpen()) {
                    this._storeCurrentAppStateAndAdjustURL();
                }
                if (oGlobalFilter && oGlobalFilter.getLiveMode() && oGlobalFilter._bResetFiltersDialogTriggered) {
                    this._storeCurrentAppStateAndAdjustURL();
                }
                this._clearStoredEntities(); //Clear previously temporarily stored entity types

                // find the list of all the controls in the smart filter bar
                var items = [];
                if (this.oGlobalFilter["_aFields"].length > 0) {
                    items = this.oGlobalFilter["_aFields"];
                } else {
                    var itemList = this.oGlobalFilter["_aFilterBarViewMetadata"];
                    for (var i = 0; i < itemList.length; i++) {
                        var itemGroup = itemList[i];
                        for (var j = 0; j < itemGroup.fields.length; j++) {
                            items.push(itemGroup.fields[j]);
                        }
                    }
                }

                // store the reference to the last focus element inside the smart filter bar
                for (var i = 0; i < items.length; i++) {
                    if (items[i].control) {
                        var control = document.getElementById(items[i].control.sId);
                        // CHECK-TO control.classList.contains('sapMFocus')
                        if (jQuery(control).hasClass("sapMFocus")) {
                            this.filterItemInFocus = items[i].control;
                            break;
                        }
                    }
                }

                var sBatchGroupId = "ovp-" + new Date().getTime();
                //process customfilters
                this._processFilters();
                this.globalEventBus.publish("OVPGlobalfilter", "OVPGlobalFilterSeacrhfired", this.aFilters);
                if (this.nRefreshInterval !== 0) {
                    if (this.oRefreshTimer !== null) {
                        clearTimeout(this.oRefreshTimer);
                    }
                    this.attachRefreshInterval(this.nRefreshInterval);
                }
                for (var modelKey in this.oCardsModels) {
                    if (this.oCardsModels.hasOwnProperty(modelKey) && !CommonUtils.isODataV4(this.oCardsModels[modelKey])) {
                        try {
                            //bForceUpdate is set to true, so that it fetches fresh data with
                            //every filter change
                            this.oCardsModels[modelKey].refresh(false, false, sBatchGroupId);
                        } catch (err) {
                            oLogger.warning(err);
                        }
                    }
                }
                this.filterChanged = false;
                this.bGoButtonPressed = false;
                this.bSearchButtonPressed = false;
                this._clearStoredEntities(); //Clear previously temporarily stored entity types
            }
        },

        _clearStoredEntities: function () {
            if (this.sPreviousEntityType) {
                this.sPreviousEntityType = "";
            }
            if (this.sCurrentEntityType) {
                this.sCurrentEntityType = "";
            }
        },

        _processSFBFilters: function () {
            var oGlobalFilter = this.getGlobalFilter(); // Get filters from smart filter bar
            var aFilters = oGlobalFilter.getFilters(); // Get filter data from smart filter bar
            // Start of Custom Filter Handling
            var oCustomFilter = this.getCustomFilters(); //Get filters from extension object
            var bIsAllowed = true; // check for synchronous calls
            var oCustomExtension;
            // the following function will be passed to all extensions. It gives them the possibility to provide their state as oAppState
            // Therefore, they must identify themselves via their instance of ControllerExtension.
            var fnAddFilter = function (oControllerExtension, oFilter) {
                if (!(oControllerExtension instanceof ControllerExtension)) {
                    throw new Error("State must always be set with respect to a ControllerExtension");
                }
                if (!bIsAllowed) {
                    throw new Error("State must always be provided synchronously");
                }
                if (oFilter) {
                    // faulty app-state information will not be stored
                    oCustomExtension = oFilter;
                }
            };
            this.templateBaseExtension.addFilters(fnAddFilter);
            bIsAllowed = false;

            var oCombinedCustomFilters = [];
            if (oCustomFilter && oCustomFilter instanceof Filter) {
                oCombinedCustomFilters.push(oCustomFilter);
            }
            if (oCustomExtension && oCustomExtension instanceof Filter) {
                oCombinedCustomFilters.push(oCustomExtension);
            }
            /*
                Remove the restriction that only SFB custom fields can come as value
                of getCustomFilters
                var aCustomFields = this.getVisibleCustomFields();

                //Check which filters are valid respective to custom fields
                //Mapping check not required, so send other fields as null
                oCustomFilter = this._checkRelevantFiltersRecursive(aCustomFields, oCustomFilter, null, null, null, null);
            */

            if (oCombinedCustomFilters.length !== 0) {
                var aCombinedFilters = [];
                if (aFilters && aFilters.length > 0) {
                    oCombinedCustomFilters.push(aFilters[0]);
                }
                aCombinedFilters.push(new Filter(oCombinedCustomFilters, true));

                if (aCombinedFilters.length > 0) {
                    aFilters = aCombinedFilters;
                }
            }
            //End of Custom Filter Handling
            this.aFilters = aFilters;
        },

        _processFilters: function () {
            if (this.getGlobalFilter()) {
                this.aFilters = [];
                this._processSFBFilters();
            } else if (this.getMacroFilterBar()) {
                this.aFilters = this.aFilters || [];
            } else {
                this.aFilters = [];
            }
            
        },

        /**
         *This function will create URL parameters from custom parameters
         * @returns string
         * @private
         */
        _processSearch: function () {
            var sCustomParams, aCustomQueryOptions;
            var oGlobalFilter = this.getGlobalFilter();

            //If Global filters not present, then skip processing
            if (!oGlobalFilter) {
                return;
            }
            //Get search data from smart filter bar
            var oParameters = oGlobalFilter.getParameters();
            var aCustomQueryOptions = oParameters && oParameters["custom"];

            if (!aCustomQueryOptions) {
                return;
            }
            for (var sName in aCustomQueryOptions) {
                sCustomParams = sName + "=" + encodeURL(aCustomQueryOptions[sName]);
            }
            return sCustomParams;
        },
        _collapseHeaderForPage: function () {
            var bMobileDevice = Device && Device.system && Device.system.phone;
            if (bMobileDevice) {
                var oGlobalFilter = this.getGlobalFilter();
                var ovpMainPage = this && this.getView().byId("ovpMain"),
                    bFilterBarExpanded = ovpMainPage && ovpMainPage.getHeaderExpanded();
                if (bFilterBarExpanded && oGlobalFilter.validateMandatoryFields()) {
                    ovpMainPage.setHeaderExpanded(false);
                }
            }
        },
        _initGlobalFilter: function () {
            var oGlobalFilter = this.getGlobalFilter();
            if (!oGlobalFilter) {
                var oOvpLayout = this.getLayout();
                var ovpConfig = this.getOwnerComponent().oOvpConfig;
                if (oOvpLayout && ovpConfig && (ovpConfig.globalFilterEntitySet || ovpConfig.globalFilterEntityType)) {
                    oOvpLayout.setActive(false);
                }
                var oMacroFilterBar = this.getMacroFilterBar();
                this._parseNavigationVariant();
                if (!oMacroFilterBar) {
                    //When application does not have any global filter, then this flag should not
                    //stop any normal processing that wait for global filter to be loaded
                    this.bGlobalFilterLoaded = true;
                    return;
                }
                this.getView().byId("ovpMain").setHeaderExpanded(true);
                this.getView().byId("ovpFilterNotFulfilledPage").setVisible(true);

                OVPUtils.loadingState.GLOBALFILTERFILLED = false;
                this.oGlobalFilterLoadedPromise = new Promise(
                    function (resolve, reject) {
                        this.fnMacroFilterBarLoaded = resolve;
                    }.bind(this)
                );
                var that = this;
                if (this.oParseNavigationPromise) {
                    this.bInitialMacroFilterBarSearch = true;
                    this.oParseNavigationPromise.then(function (data) {
                        var oAppData = data && data[0];
                        if (oAppData && oAppData.oSelectionVariant) {
                            oMacroFilterBar.setSelectionVariant(oAppData.oSelectionVariant).then(function() {
                                that.bSearchTriggeredManually = true;
                                oMacroFilterBar.triggerSearch();
                            }).catch(function(oError) {
                                // show error message in case if any errors while setting selection variant
                                oLogger.error(oError + "while setting selection variant");
                            });
                        }  
                    }).catch(function () {
                        oLogger.error("Could not parse navigation variant from URL");
                    });
                }
                return;
            }
            //When filter dialog is closed, take all filters, create appstate and update url
            oGlobalFilter.attachFiltersDialogClosed(this._storeCurrentAppStateAndAdjustURL.bind(this));

            var oVariantManagement = oGlobalFilter.getVariantManagement();
            if (oVariantManagement) {
                //Attach a function which will be triggered after variant is saved
                oVariantManagement.attachAfterSave(
                    function (oEvent) {
                        //Update the url appstate with new saved variant
                        //do not override event param so pass undefined
                        this._storeCurrentAppStateAndAdjustURL(undefined, true);
                    }.bind(this)
                );
            }
            this.oGlobalFilterLoadedPromise = new Promise(
                function (resolve, reject) {
                    //After global filter is initialized (fully initialized)
                    oGlobalFilter.attachInitialized(function () {
                        //Parse navigation variant from the URL (if exists)
                        this._parseNavigationVariant();
                        if (this.oParseNavigationPromise) {
                            var _setNavigationVariantToGlobalFilterPromise;
                            this.oParseNavigationPromise.then(
                                function (data) {
                                    var oAppData = data && data[0];
                                    var oURLParameters = data && data[1];
                                    var sNavType = data && data[2];
                                    if (oAppData) {
                                        _setNavigationVariantToGlobalFilterPromise = Promise.resolve(
                                            this._setNavigationVariantToGlobalFilter(oAppData, oURLParameters, sNavType)
                                        ).then(
                                            function () {
                                                //Setting the navigation variants trigger filter change event, we do not want the
                                                //flag to be updated unless a user explicitly changes a filter
                                                this.filterChanged = false;
                                            }.bind(this)
                                        );
                                    }
                                }.bind(this)
                            );
                            this.oParseNavigationPromise.catch(function () {
                                oLogger.error("Could not parse navigation variant from URL");
                            });
                            this.oParseNavigationPromise.finally(
                                function () {
                                    Promise.all([_setNavigationVariantToGlobalFilterPromise])
                                        .then(
                                            function () {
                                                this.bGlobalFilterInitialized = true;
                                                if (oGlobalFilter && this.verifyGlobalFilterLoaded()) {
                                                    resolve();
                                                }
                                            }.bind(this)
                                        );
                                }.bind(this)
                            );
                        } else if (oGlobalFilter && this.verifyGlobalFilterLoaded()) {
                            resolve();
                        }
                    }, this);

                    oGlobalFilter.attachSearch(function () {
                        //BCP: 2370020210 - Restrict triggering search for SFB if mandatory filter field values are not validated.
                        if (oGlobalFilter.validateMandatoryFields()) {
                            //If user pressed GO, it means that the required field varification
                            //was allredy done by the globalFilter, therefore we can resolve the promise.
                            //This is needed in case some required field was empty and therefore the promise
                            //object was not resolved in the initial flow, we have to do it now after user
                            //set the filter
                            if (!this.bGlobalFilterLoaded) {
                                resolve();
                                this.bGlobalFilterLoaded = true;
                                if (!oGlobalFilter.isDialogOpen()) {
                                    this._storeCurrentAppStateAndAdjustURL();
                                }

                                var oOvpLayout = this.getLayout();
                                if (oOvpLayout) {
                                    oOvpLayout.setActive(true);
                                }

                                //At this point, search need not be triggered as cards are not created
                                //because oGlobalFilterLoadedPromise is not resolved
                                return;
                            }
                            this.onGlobalFilterSearch();
                        }
                    }, this);
                    oGlobalFilter.attachFilterChange(this.onGlobalFilterChange, this);

                    //Currently private property is used
                    //TODO: Ask SFB to provide a way in search event that it is triggered from GO button
                    oGlobalFilter._oSearchButton &&
                        oGlobalFilter._oSearchButton.attachPress(
                            function () {
                                this.bGoButtonPressed = true;
                                this._collapseHeaderForPage();
                                var oOvpLayout = this.getLayout();
                                if (oOvpLayout) {
                                    oOvpLayout.setActive(true);
                                }
                            }.bind(this)
                        );
                }.bind(this)
            );

            this.oGlobalFilterLoadedPromise.then(
                function (oVariant) {
                    this.bGlobalFilterLoaded = true;
                    this._collapseHeaderForPage();
                    //Currently private property is used
                    //TODO: Ask SFB to provide a way in search event that it is triggered from GO button
                    oGlobalFilter._oBasicSearchField &&
                        oGlobalFilter._oBasicSearchField.attachSearch(
                            function () {
                                this.bSearchButtonPressed = true;
                            }.bind(this)
                        );
                }.bind(this)
            );
        },

        _loadCardComponent: function (sComponentName) {
            // sComponentNameForURL is created by replacing all the '.' to '/' to support sap.ui.require.toUrl API
            var sComponentNameForURL = sComponentName.replace(/\./g, "/");
            var sUrl = sap.ui.require.toUrl(sComponentNameForURL);
            if (!this.oLoadedComponents[sComponentName]) {
                this.oLoadedComponents[sComponentName] = CoreComponent.load({
                    name: sComponentName,
                    url: sUrl,
                    manifest: false
                }).then(function (oComponent) {
                    return oComponent;
                });
            }
        },

        _initCardModel: function (sCardModel) {
            var sendRelevantFiltersAsParameters = false;
            if (this.oCardsModels[sCardModel] || !sCardModel) {
                return;
            }
            this.oCardsModels[sCardModel] = this.getView().getModel(sCardModel);
            if (!CommonUtils.isODataV4(this.getView().getModel(sCardModel))) {
                if (!this.oCardsModels[sCardModel].bUseBatch) {
                    this.oCardsModels[sCardModel].setUseBatch(false);
                } else {
                    this.oCardsModels[sCardModel].setUseBatch(true);
                }
            }
            if (this.getGlobalFilter() || this.getMacroFilterBar()) {
                sendRelevantFiltersAsParameters = true;
            }
            // do not overide card model read if the cards are for v4
            if (!CommonUtils.isODataV4(this.oCardsModels[sCardModel])) {
                this._overrideCardModelRead(this.oCardsModels[sCardModel], sendRelevantFiltersAsParameters);
            }
        },

        /**
         * This function checks for custom fields in the filter bar that are
         * currently visible to user
         * @returns {object}
         * @public
         */
        getVisibleCustomFields: function () {
            var oGlobalFilter = this.getGlobalFilter();

            var aFilterItems = oGlobalFilter.getAllFilterItems(true);
            var iLen,
                oItem,
                aVisibleFields = [];

            if (aFilterItems) {
                iLen = aFilterItems.length;
                //loop through all the visible filter items and get their names
                while (iLen--) {
                    oItem = aFilterItems[iLen];
                    if (oItem && oItem.getVisibleInFilterBar()) {
                        aVisibleFields.push(oItem.getName());
                    }
                }
            }

            var iGroupCount,
                iFieldCount,
                aFields,
                aFilterBarViewMetadata = oGlobalFilter.getFilterBarViewMetadata();
            var aCustomFields = [];

            //aFilterBarViewMetadata contains a set of arrays, each array pointing to a group
            //of fields

            if (aFilterBarViewMetadata) {
                iGroupCount = aFilterBarViewMetadata.length;

                //loop through the groups
                while (iGroupCount--) {
                    aFields = aFilterBarViewMetadata[iGroupCount].fields;
                    if (aFields) {
                        iFieldCount = aFields.length;

                        //loop through the fields
                        while (iFieldCount--) {
                            //If custom control property is defined and field is visible in filter bar, then add this field
                            if (aFields[iFieldCount].isCustomFilterField && aVisibleFields.indexOf(aFields[iFieldCount].fieldName) > -1) {
                                aCustomFields.push({
                                    name: aFields[iFieldCount].fieldName
                                });
                            }
                        }
                    }
                }
            }

            return aCustomFields;
        },

        /* Function to Show error page or Hide error Page based on the parameter
         *  show : true then show the Error Page
         *  show : false Hide the Error Page
         *  @param boolean
         *  @private
         * */
        _showErrorPage: function (show) {
            //Do not execute the function if manifest settings is set to disable
            //error page
            if (this.bDisableErrorPage) {
                return;
            }
            var ovpErrorPage = this.getView().byId("ovpErrorPage");
            var ovpMainPage = this.getView().byId("ovpMain");
            if (show) {
                ovpErrorPage.setVisible(true);
                ovpMainPage.setVisible(false);
                return;
            }
            ovpErrorPage.setVisible(false);
            ovpMainPage.setVisible(true);
        },

        /**
         * This function removes all filters applied with name sFilterName from sFilterParams
         *
         * @param {String} sFilterParams - Contains all the filters to be send as a part of the request to the backend
         * @param {String} sFilterName - Filter name to be removed
         * @private
         */
        _removeFilter: function (sFilterParams, sFilterName) {
            var lastIndex = sFilterParams.lastIndexOf(sFilterName);
            var firstIndex = sFilterParams.indexOf(sFilterName);
            // Case where sFilterName is not found in sFilterParams
            if (lastIndex === -1 || firstIndex === -1) {
                return sFilterParams;
            }

            var sAndOperator = "%20and%20";
            var afterLastIndex = sFilterParams.substring(lastIndex).indexOf(sAndOperator);
            afterLastIndex = afterLastIndex !== -1 ? lastIndex + afterLastIndex : afterLastIndex;
            var beforeFirstIndex = sFilterParams.substring(0, firstIndex).lastIndexOf(sAndOperator);
            // Case where sFilterName is the only filter present in sFilterParams
            if (afterLastIndex === -1 && beforeFirstIndex === -1) {
                if (sFilterParams.lastIndexOf("$filter=") === 0) {
                    return sFilterParams.slice(0, 8);
                } else {
                    return "";
                }
            } else if (beforeFirstIndex === -1) {
                // Case where sFilterName is the first filter in sFilterParams
                if (sFilterParams.lastIndexOf("$filter=") === 0) {
                    return sFilterParams.slice(0, 8) + sFilterParams.slice(afterLastIndex + sAndOperator.length);
                } else {
                    return sFilterParams.slice(afterLastIndex + sAndOperator.length);
                }
            } else if (afterLastIndex === -1) {
                // Case where sFilterName is the last filter in sFilterParams
                return sFilterParams.slice(0, beforeFirstIndex);
            } else {
                // Case where sFilterName is present in between other filters in sFilterParams
                return sFilterParams.slice(0, beforeFirstIndex) + sFilterParams.slice(afterLastIndex);
            }
        },

        /**
         * This function removes all relevant filters applied with name sCardFilter from aRelevantFilters recursively
         *
         * @param {Array} aRelevantFilters - Contains all relevant filters
         * @param {String} sCardFilter - Filter name to be removed
         * @private
         */
        _removeRelevantFilterRecursively: function (aRelevantFilters, sCardFilter) {
            // End of recursion (Base case)
            if (!aRelevantFilters._bMultiFilter) {
                if (aRelevantFilters.sPath === sCardFilter) {
                    return undefined;
                }
                return aRelevantFilters;
            } else {
                aRelevantFilters.aFilters.forEach(
                    function (oRelevantFilters, iIndex) {
                        aRelevantFilters.aFilters[iIndex] = this._removeRelevantFilterRecursively(oRelevantFilters, sCardFilter);
                    }.bind(this)
                );
                for (var i = 0; i < aRelevantFilters.aFilters.length; i++) {
                    if (!aRelevantFilters.aFilters[i]) {
                        aRelevantFilters.aFilters.splice(i, 1);
                        i--;
                    }
                }
                if (aRelevantFilters.aFilters.length > 0) {
                    return aRelevantFilters;
                } else {
                    return undefined;
                }
            }
        },

        /**
         * This function calls _removeRelevantFilterRecursively to remove relevant filters named sCardFilter
         *
         * @param {Array} aRelevantFilters - Contains all relevant filters
         * @param {String} sCardFilter - Filter name to be removed
         * @private
         */
        _removeRelevantFilter: function (aRelevantFilters, sCardFilter) {
            if (!aRelevantFilters || aRelevantFilters.length === 0) {
                return aRelevantFilters;
            }
            aRelevantFilters[0] = this._removeRelevantFilterRecursively(aRelevantFilters[0], sCardFilter);
            return !aRelevantFilters[0] ? undefined : aRelevantFilters;
        },

        /**
         * This function gets Filter Preference from the manifest
         *
         * @param {String} sCardId - Card Id
         * @private
         */
        _getFilterPreference: function (sCardId) {
            var mFilterPreference;
            var oCard = this._getCardFromManifest(sCardId);
            if (oCard) {
                if (oCard.settings.tabs) {
                    var iIndex = 0;
                    var iSelectedKey = oCard.settings.selectedKey;
                    if (iSelectedKey && oCard.settings.tabs.length >= iSelectedKey) {
                        iIndex = iSelectedKey - 1;
                    }
                    mFilterPreference = oCard.settings.tabs[iIndex].mFilterPreference;
                } else {
                    mFilterPreference = oCard.settings.mFilterPreference;
                }
            }

            return mFilterPreference;
        },

        /**
         * This function gets Filter Preference by parsing url parameters
         *
         * @param {Object} oParameters - Contains filter parameters
         * @private
         */
        _getFilterPreferenceFromUrlParams: function (oParameters) {
            var aUrlParams = oParameters.urlParameters;
            var mFilterPreference;
            var sCustomParameterName = "cardId=";
            var cardIdIndex = -1;
            if (aUrlParams) {
                for (var index = 0; index < aUrlParams.length; index++) {
                    // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
                    if (aUrlParams[index].lastIndexOf(sCustomParameterName) >= 0) {
                        cardIdIndex = index;
                        break;
                    }
                }

                if (cardIdIndex >= 0) {
                    var iLastIndex = aUrlParams[cardIdIndex].lastIndexOf(sCustomParameterName);
                    var sCardId = aUrlParams[cardIdIndex].slice(iLastIndex + sCustomParameterName.length);
                    mFilterPreference = this._getFilterPreference(sCardId);
                    if (iLastIndex > 0) {
                        aUrlParams[cardIdIndex] = aUrlParams[cardIdIndex].slice(0, iLastIndex - 1);
                    } else {
                        aUrlParams.splice(cardIdIndex, 1);
                    }
                }
            }
            return mFilterPreference;
        },

        /**
         * This function add relevant filters in the request
         *
         * @param {Object} oParameters - Contains filter parameters
         * @param {Object} oModel - OData Model to filter
         * @param {Object} oEntityType - Entity Type
         * @param {Object} mFilterPreference - Filter preference for respective card's
         * @private
         */
        _addRelevantFilters: function (oParameters, oModel, oEntityType, mFilterPreference) {
            var aUrlParams = oParameters.urlParameters;
            var foundIndex = -1;
            if (aUrlParams) {
                for (var index = 0; index < aUrlParams.length; index++) {
                    // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
                    if (aUrlParams[index].lastIndexOf("$filter=", 0) === 0) {
                        foundIndex = index;
                        break;
                    }
                }
            }

            // Case where there are relevant global filters
            if (this.aRelevantFilters && this.aRelevantFilters.length > 0) {
                if (foundIndex >= 0) {
                    var sFilterParams = ODataUtils.createFilterParams(this.aRelevantFilters, oModel.oMetadata, oEntityType).substr(8);
                    /**
                     *  Filter preference
                     *  1. All card level filters
                     *  2. All global level filters
                     *  3. Both card or global level filters can be applied depending on property mentioned in respective arrays
                     *  4. Default behavior
                     */
                    if (mFilterPreference && mFilterPreference.filterAll === "card") {
                        aUrlParams[foundIndex] = aUrlParams[foundIndex];
                    } else if (mFilterPreference && mFilterPreference.filterAll === "global") {
                        aUrlParams[foundIndex] = aUrlParams[foundIndex].slice(0, 8) + sFilterParams;
                    } else if (mFilterPreference && (mFilterPreference.cardFilter || mFilterPreference.globalFilter)) {
                        if (Array.isArray(mFilterPreference.cardFilter) && mFilterPreference.cardFilter.length > 0) {
                            mFilterPreference.cardFilter.forEach(function (sCardFilter) {
                                sFilterParams = this._removeFilter(sFilterParams, sCardFilter);
                            }.bind(this));
                        }
                        if (Array.isArray(mFilterPreference.globalFilter) && mFilterPreference.globalFilter.length > 0) {
                            mFilterPreference.globalFilter.forEach(function (sGlobalFilter) {
                                aUrlParams[foundIndex] = this._removeFilter(aUrlParams[foundIndex], sGlobalFilter);
                            }.bind(this));
                        }

                        // Case where there are no filters to apply
                        if (sFilterParams === "" && aUrlParams[foundIndex].length === 8) {
                            aUrlParams.splice(foundIndex, 1);
                        } else if (sFilterParams === "") {
                            // Case where there no global filters
                            aUrlParams[foundIndex] = aUrlParams[foundIndex];
                        } else if (aUrlParams[foundIndex].length === 8) {
                            // Case where there are no card filters
                            aUrlParams[foundIndex] = aUrlParams[foundIndex] + sFilterParams;
                        } else {
                            // Case where there are both card & global level filters
                            if (this.aRelevantFilters.length === 1) {
                                sFilterParams = "(" + sFilterParams + ")";
                            }
                            aUrlParams[foundIndex] = aUrlParams[foundIndex].slice(0, 8) + "(" + aUrlParams[foundIndex].slice(8, aUrlParams[foundIndex].length) + ")%20and%20" + sFilterParams;
                        }
                    } else {
                        if (this.aRelevantFilters.length === 1) {
                            sFilterParams = "(" + sFilterParams + ")";
                        }
                        aUrlParams[foundIndex] = aUrlParams[foundIndex].slice(0, 8) + "(" + aUrlParams[foundIndex].slice(8, aUrlParams[foundIndex].length) + ")%20and%20" + sFilterParams;
                    }
                } else {
                    if (mFilterPreference && mFilterPreference.filterAll === "card") {
                        oParameters.filters = undefined;
                    } else if (mFilterPreference && mFilterPreference.filterAll === "global") {
                        oParameters.filters = this.aRelevantFilters;
                    } else if (mFilterPreference && (mFilterPreference.cardFilter || mFilterPreference.globalFilter)) {
                        if (Array.isArray(mFilterPreference.cardFilter) && mFilterPreference.cardFilter.length > 0) {
                            mFilterPreference.cardFilter.forEach(function (sCardFilter) {
                                this.aRelevantFilters = this._removeRelevantFilter(this.aRelevantFilters, sCardFilter);
                            }.bind(this));
                        }
                        if (this.aRelevantFilters && this.aRelevantFilters.length > 0) {
                            oParameters.filters = this.aRelevantFilters;
                        }
                    } else {
                        oParameters.filters = this.aRelevantFilters;
                    }
                }
            } else {
                // Case where there are no relevant global filters
                if (foundIndex >= 0) {
                    /**
                     *  Filter preference
                     *  1. All card level filters
                     *  2. All global level filters
                     *  3. Global level filters can be applied depending on property mentioned in respective array
                     */
                    if (mFilterPreference && mFilterPreference.filterAll === "card") {
                        aUrlParams[foundIndex] = aUrlParams[foundIndex];
                    } else if (mFilterPreference && mFilterPreference.filterAll === "global") {
                        aUrlParams.splice(foundIndex, 1);
                    } else if (mFilterPreference && mFilterPreference.globalFilter) {
                        if (Array.isArray(mFilterPreference.globalFilter) && mFilterPreference.globalFilter.length > 0) {
                            mFilterPreference.globalFilter.forEach(function (sGlobalFilter) {
                                aUrlParams[foundIndex] = this._removeFilter(aUrlParams[foundIndex], sGlobalFilter);
                            }.bind(this));
                        }

                        // Case where there are no card level filter
                        if (aUrlParams[foundIndex].length === 8) {
                            aUrlParams.splice(foundIndex, 1);
                        }
                    }
                }
            }
            return oParameters;
        },

        removeInternalParamValue: function (aParams, sParamValue) {
            return aParams && aParams.reduce(function (arr, currentValue) {
                if (currentValue && currentValue.includes(sParamValue)) {
                    currentValue = currentValue.substring(0, currentValue.indexOf(sParamValue) - 1);
                }
                if (currentValue) {
                    arr.push(currentValue);
                }
                return arr;
            }, []);
        },

        /**
         * This function is serving two Purpose
         * 1. If sendRelevantFiltersInUrl is true : Then Overriding the read function of the oDataModel with a function
         *    that will first find the relevant filters from the filter bar and then will call the original
         *    read function with the relevant filters as parameters.
         * 2. Providing Additional functionality to capture success and failure callback to show error page if non of
         *    the requests gets successful.
         * @param oModel
         * @param boolean
         * @private
         */
        _overrideCardModelRead: function (oModel, sendRelevantFiltersAsParameters) {
            var fOrigRead = oModel.read;
            var that = this;
            oModel.read = function () {
                var oParameters = arguments[1];
                if (!oParameters) {
                    oParameters = {};
                    Array.prototype.push.call(arguments, oParameters);
                }
                var oEntityType = that._getEntityTypeFromPath(oModel, arguments[0], oParameters.context, false);
                var oEntitySet = that._getEntitySetFromEntityType(oModel, oEntityType);

                //If the call is not for a card, then call the original model read without modifying the request
                var aURLParams = oParameters && oParameters.urlParameters;
                var bCardCall = false;
                if (aURLParams && Array.isArray(aURLParams)) {
                    bCardCall = aURLParams.some(function (sParam) {
                        return sParam && sParam.indexOf('_requestFrom=ovp_internal') > -1;
                    });
                } else if (aURLParams && typeof aURLParams === 'object') {
                    bCardCall = aURLParams["_requestFrom"] === 'ovp_internal';
                }

                if (!bCardCall) {
                    return fOrigRead.apply(oModel, arguments);
                }
                //remove the dummy parameter from url params once identified that it is an ovp card
                if (aURLParams && Array.isArray(aURLParams)) {
                    aURLParams = that.removeInternalParamValue(aURLParams, "_requestFrom=ovp_internal");
                    oParameters.urlParameters = aURLParams; // replace url parameters after removing internal flag
                } else if (aURLParams && typeof aURLParams === 'object' && bCardCall) {
                    delete aURLParams["_requestFrom"];
                }

                var mFilterPreference = that._getFilterPreferenceFromUrlParams(oParameters);
                //If the call is for a card data, then modify the request to attach global filter data
                if (sendRelevantFiltersAsParameters) {
                    //Process the filters from smart filter bar
                    that._processFilters();
                    var oGlobalFilter = that.getGlobalFilter();
                    var oMacroFilter = that.getMacroFilterBar();
                    var oFilterModel = oGlobalFilter !== undefined ? oGlobalFilter.getModel() : oMacroFilter.getModel();

                    if (!that.aFilters) {
                        //For initial load case
                        that.aFilters = [];
                    }
                    var bCheckEntity = false;
                    //Process the search from smart filter bar
                    var sCustomParams;
                    var oSearchRestrictions = oEntitySet["Org.OData.Capabilities.V1.SearchRestrictions"];
                    if (
                        oEntitySet["sap:searchable"] === "true" ||
                        (oSearchRestrictions && oSearchRestrictions.Searchable && oSearchRestrictions.Searchable.Bool && oSearchRestrictions.Searchable.Bool === "true")
                    ) {
                        sCustomParams = that._processSearch();
                    }
                    that.sCurrentEntityType = oEntityType.entityType;
                    //If previous call and current call are for same entity, then need not do the
                    //same calculation again
                    if (that.sPreviousEntityType !== that.sCurrentEntityType) {
                        that.sPreviousEntityType = that.sCurrentEntityType;
                        bCheckEntity = true;
                    }
                    if (!that.aRelevantFilters) {
                        //For initial load case
                        that.aRelevantFilters = [];
                        bCheckEntity = true;
                    }
                    //If recalculation is required
                    //Case when a new entityset is encountered or on initial load
                    if (bCheckEntity) {
                        that.aRelevantFilters = [];
                        if (oEntityType) {
                            that.aRelevantFilters = that._getEntityRelevantFilters(oEntityType, that.aFilters, oModel, oFilterModel);
                        }
                    }
                    oParameters = that._addRelevantFilters(oParameters, oModel, oEntityType, mFilterPreference);
                    var aUrlParams = oParameters.urlParameters;
                    if (sCustomParams) {
                        aUrlParams[aUrlParams.length] = sCustomParams;
                    }
                    //Process parameters
                    if (oGlobalFilter && oGlobalFilter.getConsiderAnalyticalParameters()) {
                        var sGlobalAnalyticalPath = oGlobalFilter.getAnalyticBindingPath();
                        var iIndexOf, sOldEntityPath, sNewEntityPath;

                        if (sGlobalAnalyticalPath && sGlobalAnalyticalPath.length > 0) {
                            //For entity mapped to global filter
                            if (oEntityType.entityType === SmartFilterBarHandler.getEntityType(oGlobalFilter)) {
                                //arguments[0] contains entity path where parameter values need to be updated
                                sOldEntityPath = arguments[0];
                                iIndexOf = arguments[0].indexOf("$");

                                if (iIndexOf > 0) {
                                    sOldEntityPath = arguments[0].substring(0, iIndexOf - 1);
                                }
                                sNewEntityPath = sGlobalAnalyticalPath;
                                //Update entity path
                                if (sOldEntityPath !== sNewEntityPath) {
                                    arguments[0] = arguments[0].replace(sOldEntityPath, sNewEntityPath);
                                }
                            } else {
                                //For entities, not mapped to global filter
                                //From the entity parameter path, extract the parameters and their values
                                var aEntityParams = that._getParametersFromEntityPath(arguments[0]);
                                var aGlobalParams = that._getParametersFromEntityPath(sGlobalAnalyticalPath);
                                var sMappedParameter, sRegEx, sMatch;

                                //If current entity has params
                                if (aEntityParams && aEntityParams.length > 0) {
                                    var oParameterEntity = that._getEntityTypeFromPath(oModel, arguments[0], oParameters.context, true);

                                    //Loop around the global filter parameters
                                    for (var i = 0; i < aGlobalParams.length; i++) {
                                        //Get the corresponding parameter of entity that matches global parameter
                                        sMappedParameter = that._getPropertyMapping(
                                            aEntityParams,
                                            aGlobalParams[i].name,
                                            oParameterEntity.name,
                                            SmartFilterBarHandler.getEntityType(oGlobalFilter),
                                            oModel,
                                            oGlobalFilter.getModel()
                                        );

                                        if (sMappedParameter) {
                                            //Expression can be of form "..P1=V1,.." or "..P1=V1)"
                                            //.* denotes any data
                                            //? if for non-greedy shortest search
                                            sRegEx = sMappedParameter + "=.*?[,)]";

                                            //slice(0,-1) is used to truncate the last character which is ',' or ')'
                                            sMatch = arguments[0].match(new RegExp(sRegEx));

                                            if (sMatch && sMatch.length > 0) {
                                                sOldEntityPath = sMatch[0].slice(0, -1);
                                                sNewEntityPath = sMappedParameter + "=" + aGlobalParams[i].sValue;
                                                //Update entity path
                                                if (sOldEntityPath !== sNewEntityPath) {
                                                    arguments[0] = arguments[0].replace(sOldEntityPath, sNewEntityPath);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                //commenting it now for the case where two entity sets are pointing to one entity type. This case is not handled by
                // odata4analytics class. For a temporary fix commenting this check.

                //check if entity set requires parameters and is it provided
                //var bParamsValidation =  that._checkMandatoryParams(oModel, oEntitySet.name, arguments[0]);

                var oMetaModel = oModel.getMetaModel();
                var oDataEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
                aUrlParams = that._getExpandPropertiesForSmartCharts(aUrlParams, oMetaModel, oDataEntityType);
                /*Storing old function in variable*/
                var fOrigSuccess = arguments[1].success;
                /*Appending success function with our custom code*/
                /*Using IIFE to pass the context of function and the this(that) to the below function*/
                arguments[1].success = (function (func, that) {
                    return function () {
                        /*Setting the variable to true if it was set to false*/
                        if (!that.errorHandlingObject.atLeastOneRequestSuccess) {
                            that.errorHandlingObject.atLeastOneRequestSuccess = true;
                            /*To Hide error page*/
                            that._showErrorPage(false);
                        }
                        // restoring the focus for the element that was in the focus when global filter was triggered
                        if (that.filterItemInFocus != null) {
                            that.filterItemInFocus.focus();
                            that.filterItemInFocus = null;
                        }
                        /*
                         * checking:
                         * if refresh interval is available and refresh timer is set
                         * resetting the timer and creating a new one with the refresh interval
                         * mentioned in the manifest
                         */

                        if (that.nRefreshInterval !== 0) {
                            if (that.oRefreshTimer !== null) {
                                clearTimeout(that.oRefreshTimer);
                            }
                            that.attachRefreshInterval(that.nRefreshInterval);
                        }
                        return func.apply(this, arguments);
                    };
                })(fOrigSuccess, that);

                /*Storing old function in variable*/
                var fOrigError = arguments[1].error;
                /*Appending success function with our custom code*/
                /*Using IIFE to pass the context of function and the this(that) to the below function*/
                arguments[1].error = (function (func, that) {
                    return function () {
                        if (!that.errorHandlingObject.atLeastOneRequestSuccess) {
                            /*Clear earlier timeouts*/
                            clearTimeout(that.errorHandlingObject.errorLoadingTimeout);
                            /*Setting timeout as 9 sec after this request get failed,To find if all requests got failed*/
                            that.errorHandlingObject.errorLoadingTimeout = setTimeout(function () {
                                if (!that.errorHandlingObject.atLeastOneRequestSuccess) {
                                    that._showErrorPage(true);
                                }
                            }, 9000);
                        }
                        return func.apply(this, arguments);
                    };
                })(fOrigError, that);
                var oReadObject = fOrigRead.apply(oModel, arguments);
                return oReadObject;

                // if (bParamsValidation === false) { //if mandatory parameters are not filled --> abort the call and create error card
                //    oReadObject.abort();
                //    that.showErrorCardForMissingParam(arguments, oModel);
                // } else {
                //    return oReadObject;
                //}
            };
        },

        //creating a base event object which should be passed in fVerifyAndSetErrorOrCustomMessageCard
        //passing modelUrl, reponse object and model
        showErrorCardForMissingParam: function (responeArg, oModel) {
            var modelUrl = responeArg[0];
            var urlParameters = responeArg[1].urlParameters;
            for (var i in urlParameters) {
                modelUrl = modelUrl + urlParameters[i];
            }
            var baseEventObject = new BaseEvent();
            baseEventObject.mParameters = {
                url: modelUrl,
                response: {
                    statusText: OvpResources.getText("Missing_Param_Text")
                }
            };
            baseEventObject.oSource = oModel;
            //triggering a async call so that card components should be created
            setTimeout(
                function () {
                    this.fVerifyAndSetErrorOrCustomMessageCard(baseEventObject, false);
                }.bind(this),
                0
            );
        },

        //checking if the entity set is parameterized and if it has all mandatory params passed
        _checkMandatoryParams: function (oDataModel, oEntitySet, sEntityPath) {
            var o4a = new oData4Analytics.Model(oData4Analytics.Model.ReferenceByModel(oDataModel));
            var queryResult = o4a.findQueryResultByName(oEntitySet);
            // var queryResultRequest = new oData4Analytics.QueryResultRequest(queryResult);

            var parameterization = queryResult && queryResult.getParameterization();
            if (!parameterization) {
                // checking if the entity set is parameterized and returning it
                return true;
            }
            var aParameters = parameterization.getAllParameterNames();
            var paramMatchInPath = sEntityPath.match(/\(.*\)/g);
            if (aParameters.length > 0 && paramMatchInPath === null) {
                //checking if params are added in the path. abort the call if not added
                return false;
            }
            var aParamsInPath = paramMatchInPath[0].replace("(", "").replace(")", "").split(",");
            if (aParamsInPath.length === aParameters.length) {
                for (var i in aParamsInPath) {
                    var currentParamValue = aParamsInPath[i].split("=")[1];
                    if (currentParamValue.indexOf("%27") > -1) {
                        //The Parameter values needn't always have %27 hence having this fix to check for %27 and then only splitting
                        currentParamValue = currentParamValue.split("%27")[1];
                    }
                    if (currentParamValue.length === 0) {
                        //checking the value of params in path. If empty abort the call
                        return false;
                    }
                }
            } else {
                // no. of params in path should be same as all params. Abort the call if not
                return false;
            }
        },

        /**
         * Function to fetch text properties coming from associated entity. It updates $select params and adds $expand with the association.
         * This function is intended for chart cards only.
         * @param aUrlParams
         * @param oMetaModel
         * @param oDataEntityType
         * @returns {object}
         * @private
         * */
        _getExpandPropertiesForSmartCharts: function (aUrlParams, oMetaModel, oDataEntityType) {
            var aSelectParams;
            var sProperty = "";
            var aParts;
            var oAssociationEnd;
            var tempStr;
            var sExpand = "$expand";
            var bExpandSet = false;
            var bHasSelect = false;
            var sDecodedSelect;
            var sOrigSelect;
            var sUpdatedSelect;
            var sTextKey = "com.sap.vocabularies.Common.v1.Text";
            var allProps = oDataEntityType && oDataEntityType.property;

            if (!aUrlParams || !(aUrlParams.length > 0)) {
                return aUrlParams;
            }

            for (var l = 0; l < aUrlParams.length; l++) {
                if (aUrlParams[l].indexOf("$expand") > -1) {
                    //If the aUrlParams contain $expand, the card is definitely not a chart card
                    return aUrlParams;
                }
            }
            for (var selectPosition = 0; selectPosition < aUrlParams.length; selectPosition++) {
                //Check for $select as all the data calls for CHARTS will have $select
                if (aUrlParams[selectPosition].indexOf("$select") > -1) {
                    bHasSelect = true;
                    sOrigSelect = aUrlParams[selectPosition]; //Make a copy of the $select
                    tempStr = aUrlParams[selectPosition].split("$select=");
                    if (tempStr && tempStr[1]) {
                        //Sometimes the URI can be encoded, decode the URI and edit it.
                        sDecodedSelect = decodeURIComponent(tempStr[1]);
                        aSelectParams = sDecodedSelect.split(","); //Split at , to seperate the properties
                        if (!aSelectParams || !(aSelectParams.length > 1)) {
                            //For chart cards, aSelectParams.length should always be > 1. aSelectParams.length = 1 for KPI value call
                            return aUrlParams;
                        }
                    }
                    break;
                }
            }

            if (!bHasSelect) {
                return aUrlParams;
            }

            if (!aSelectParams || !(aSelectParams.length > 0) || !allProps || !(allProps.length > 0)) {
                return aUrlParams;
            }

            /*
             * For every parameter in selectParams, loop through the properties in the metadata
             * */
            for (var j = 0; j < aSelectParams.length; j++) {
                for (var k = 0; k < allProps.length; k++) {
                    //For every property in $select loop over all the properties for sap:text or text association
                    if (aSelectParams[j] == (allProps[k] && allProps[k].name)) {
                        //This functionality is only for smart charts, hence check for aggregation role in metadata of the prop
                        if (allProps[k] && allProps[k]["sap:aggregation-role"] && allProps[k]["sap:aggregation-role"] == "dimension") {
                            if (!allProps[k][sTextKey] || !allProps[k][sTextKey].Path || !(allProps[k][sTextKey].Path.indexOf("/") > 0)) {
                                break;
                            }
                            sProperty = allProps[k][sTextKey].Path;
                            aParts = sProperty.split("/"); //For Text coming from navigation property
                            if (!aParts.length) {
                                break;
                            }
                            oAssociationEnd = oMetaModel.getODataAssociationEnd(oDataEntityType, aParts[0]); //Check if it's a valid association
                            if (!oAssociationEnd) {
                                break;
                            }
                            if (!bExpandSet) {
                                //No $expand in urlparam yet
                                sExpand = sExpand + "=" + aParts[0];
                                bExpandSet = true;
                            } else if (bExpandSet) {
                                //$expand already exists in urlparam
                                sExpand = sExpand + "," + aParts[0];
                            }
                            //Form the $select string
                            sUpdatedSelect = sOrigSelect + "," + sProperty;
                        }
                        break; //No need to check for other props
                    }
                }
            }
            if (sUpdatedSelect && sExpand) {
                //aUrlParams[i] will still have $select because we broke out of the loop on top
                aUrlParams[selectPosition] = sUpdatedSelect; // $select=......&$expand=....
                //aUrlParams[aUrlParams.length] = sExpand;
                aUrlParams.push(sExpand);
            }
            return aUrlParams;
        },

        attachRefreshInterval: function (nRefreshInterval) {
            this.oRefreshTimer = setTimeout(
                function () {
                    this._processFilters();
                    this.globalEventBus.publish("OVPGlobalfilter", "OVPGlobalFilterSeacrhfired", this.aFilters);
                    var oLayout = this.getLayout();
                    if (oLayout && oLayout.getActive()) {
                        for (var modelKey in this.oCardsModels) {
                            this.isModelRefreshTriggered = true;
                            if (!CommonUtils.isODataV4(this.oCardsModels[modelKey])) {
                                this.oCardsModels[modelKey].refresh(false, false);
                            }
                        }
                    }
                }.bind(this),
                nRefreshInterval
            );
        },

        /**
         * This is a temporary function used to retrieve the EntityType from a given path to an entity.
         * This function is required due to fact that the function _getEntityTypeByPath of the ODataMetadata is not public.
         * @param oModel
         * @param sPath
         * @param oContext
         * @returns {object}
         * @private
         */
        _getEntityTypeFromPath: function (oModel, sPath, oContext, bIsParameter) {
            //TODO need to request UI5 to have this a public API!!!!
            var sNormPath = ODataModel.prototype._normalizePath.apply(oModel, [sPath, oContext]);

            //For parameter entities,remove all parameters and then extract the actual
            //parameter entity name. If not done, then it will fetch result entity type
            if (bIsParameter) {
                sNormPath = sPath.replace(/^\/|\/$/g, "").split("/")[0];
                if (sNormPath.indexOf("(") != -1) {
                    sNormPath = sNormPath.substring(0, sNormPath.indexOf("("));
                }
            }

            var oEntityType = ODataMetadata.prototype._getEntityTypeByPath.apply(oModel.oMetadata, [sNormPath]);
            return oEntityType;
        },

        /**
         * Function to pick the metamodel and return the entityset for a given
         * entitytype
         * @param oModel
         * @param oEntityType
         * @returns {object}
         * @private
         */
        _getEntitySetFromEntityType: function (oModel, oEntityType) {
            if (!oModel || !oEntityType) {
                return;
            }
            var oMetaModel = oModel.getMetaModel();
            var oEntityContainer = oMetaModel && oMetaModel.getODataEntityContainer();
            var aEntitySet = oEntityContainer && oEntityContainer.entitySet;
            if (!aEntitySet || !Array.isArray(aEntitySet)) {
                return;
            }
            //Loop through all entity sets and find matching for given entity type
            var iLen = aEntitySet.length;
            for (var i = 0; i < iLen; i++) {
                if (aEntitySet[i].entityType === oEntityType.entityType) {
                    return aEntitySet[i];
                }
            }
        },

        /**
         * This function takes a set of entity properties and tries to find a
         * match or a mapped property by comparing to a provided property name
         * @param aEntityProperties
         * @param sTargetProperty
         * @param sEntityname
         * @param sTargetEntityname
         * @param oEntityModel
         * @param oTargetModel
         * @returns {string}
         * @private
         */
        _getPropertyMapping: function (aEntityProperties, sTargetProperty, sEntityname, sTargetEntityname, oEntityModel, oTargetModel) {
            var i, sMappedProperty;
            //Check if entity property found with same name
            for (i = 0; i < aEntityProperties.length; i++) {
                if (aEntityProperties[i].name === sTargetProperty) {
                    sMappedProperty = aEntityProperties[i].name;
                    return sMappedProperty;
                }
                //If direct match not found then check for fuzzy logic using "P_"
                if ("P_" + aEntityProperties[i].name === sTargetProperty || aEntityProperties[i].name === "P_" + sTargetProperty) {
                    sMappedProperty = aEntityProperties[i].name;
                    return sMappedProperty;
                }
            }

            //sEntityname, sTargetEntityname and oModel are optional, if not passed annotation mapping will not be considered
            if (!sEntityname || !sTargetEntityname || !oEntityModel || !oTargetModel) {
                return;
            }
            //If direct property not found, then check for mapped property
            var oEntity = oEntityModel.oMetadata._getEntityTypeByName(sEntityname);
            var oTargetEntity = oTargetModel.oMetadata._getEntityTypeByName(sTargetEntityname);

            if (!oEntity || !oTargetEntity) {
                return;
            }

            var s_semantic_object = "com.sap.vocabularies.Common.v1.SemanticObject";
            var s_semantic_map = "com.sap.vocabularies.Common.v1.SemanticObjectMapping";
            var oEntityModelAnnotations = oEntityModel.oAnnotations.getAnnotationsData();

            if (!oEntityModelAnnotations || !oEntityModelAnnotations.propertyAnnotations) {
                return;
            }
            var oEntityPropAnnotations = oEntityModelAnnotations.propertyAnnotations[oEntity.namespace + "." + oEntity.name];
            var oTargetModelAnnotations = oTargetModel.oAnnotations.getAnnotationsData();

            if (!oTargetModelAnnotations || !oTargetModelAnnotations.propertyAnnotations) {
                return;
            }
            var oTargetPropAnnotations = oTargetModelAnnotations.propertyAnnotations[oTargetEntity.namespace + "." + oTargetEntity.name]; //Global filter entity annotations
            var oTargetPropAnnotation = oTargetPropAnnotations && oTargetPropAnnotations[sTargetProperty];

            //If annotations present for sTargetProperty, then only search entity annotations for a mapping
            if (!oTargetPropAnnotation || !oTargetPropAnnotation[s_semantic_object]) {
                return;
            }

            var sPropertyKey, oEntityPropAnnotation, aMappedAnnotation, iMapCount, sLocalProperty;
            //Loop through annotations for each property in entity
            for (sPropertyKey in oEntityPropAnnotations) {
                oEntityPropAnnotation = oEntityPropAnnotations[sPropertyKey];
                //If entity current property and filter property annotations contain same semantic object
                if (oEntityPropAnnotation[s_semantic_object] && oEntityPropAnnotation[s_semantic_object].String === oTargetPropAnnotation[s_semantic_object].String) {
                    aMappedAnnotation = oEntityPropAnnotation[s_semantic_map];
                    //If mapping not present
                    if (!aMappedAnnotation) {
                        continue; //go to next loop
                    }
                    iMapCount = aMappedAnnotation.length;
                    sLocalProperty = "";
                    //Check all mappings for a match
                    while (iMapCount--) {
                        if (aMappedAnnotation[iMapCount].SemanticObjectProperty.String === sTargetProperty) {
                            sLocalProperty = aMappedAnnotation[iMapCount].LocalProperty.PropertyPath;
                            break; //Match found
                        }
                    }
                    //Local property found for entity
                    //Verify if property is present in entity before returning
                    if (sLocalProperty !== "") {
                        for (i = 0; i < aEntityProperties.length; i++) {
                            if (aEntityProperties[i].name === sLocalProperty) {
                                sMappedProperty = aEntityProperties[i].name;
                                return sMappedProperty;
                            }
                        }
                    }
                }
            }
            return sMappedProperty;
        },

        /**
         * This function takes an entity path as input and breaks it into
         * parameters and values
         * @param sEntityPath
         * @returns {array}
         * @private
         */
        _getParametersFromEntityPath: function (sEntityPath) {
            //Remove any section like sorters,filters after ? sign
            //Check if some pattern present like "(parameterdata)" with atleast one = sign
            //Atleast one = sign means the parameter is of format P1 = V1
            //'('and ')' are used with escape characters.
            //'.*' means any data
            sEntityPath = sEntityPath.split("?")[0];
            var aMatch = sEntityPath.match(/\(.*=.*\)/);
            var aEntityParams = [];

            //If a matching substring is not found, then null is returned by match function
            if (!aMatch) {
                return aEntityParams;
            }
            //Match returns an array, so take the first match from array
            //Replace start and end bracket using slice()
            //Remove any leading or lagging spaces
            //Split string whenever a '=' or a ',' is encountered
            //'=' separates params from values, and ',' separates two params
            var aParamsAndValues = aMatch[0].slice(1, -1).trim().split(/\=|\,/);
            //In aParamsAndValues, odd places contain param names and even places contain values
            for (var i = 0; i < aParamsAndValues.length; i = i + 2) {
                aEntityParams.push({
                    name: aParamsAndValues[i],
                    sValue: aParamsAndValues[i + 1] //This value is URI encoded as we take it from URI path
                });
            }
            return aEntityParams;
        },

        /**
         * This function recursively checks the nested filters and returns the relevant filters
         * that match any of the entity properties.
         * @param aEntityProperties
         * @param oFilterDetails
         * @param sEntityname
         * @param sTargetEntityname
         * @param oEntityModel
         * @param oTargetModel
         * @returns {object}
         * @private
         */
        _checkRelevantFiltersRecursive: function (aEntityProperties, oFilterDetails, sEntityname, sTargetEntityname, oEntityModel, oTargetModel) {
            if (!oFilterDetails._bMultiFilter) {
                //End point of recursion (base case)
                oFilterDetails.sPath = oFilterDetails.sPath.split("/").pop();
                //Get the mapping property. This would return the same property name in case a match is found
                //or else a property that is mapped in annotations. If nothing is found, then it returns null
                var sMappedProperty = this._getPropertyMapping(aEntityProperties, oFilterDetails.sPath, sEntityname, sTargetEntityname, oEntityModel, oTargetModel);
                if (sMappedProperty) {
                    oFilterDetails.sPath = sMappedProperty;
                    return oFilterDetails;
                }
            } else {
                //For multifilter cases, there are deep structures
                var aDeepFilters = oFilterDetails.aFilters;
                var oSelectedFilter,
                    aSelectedFilters = [];

                if (aDeepFilters) {
                    for (var i = 0; i < aDeepFilters.length; i++) {
                        //Get the relevant filter object for each internal filter
                        oSelectedFilter = this._checkRelevantFiltersRecursive(aEntityProperties, aDeepFilters[i], sEntityname, sTargetEntityname, oEntityModel, oTargetModel);
                        if (oSelectedFilter) {
                            aSelectedFilters.push(oSelectedFilter);
                        }
                    }
                    if (aSelectedFilters.length > 0) {
                        return new Filter(aSelectedFilters, oFilterDetails.bAnd);
                    }
                }
            }
        },

        /**
         * This function goes over the provided list of filters and checks which filter appears as a field
         * in the EntityType provided. The fields that appears in both lists  (filters and EntityType fields)
         * will be returned in an array.
         * @param oEntityType
         * @param aFilters
         * @param oEntityModel
         * @param oFilterModel
         * @returns {array}
         * @private
         */
        _getEntityRelevantFilters: function (oEntityType, aFilters, oEntityModel, oFilterModel) {
            var oReturnFilterWrap = [];

            if (aFilters.length > 0 && oEntityType) {
                var entityType = this.isMacroFilterBar ? oEntityType.entityType : SmartFilterBarHandler.getEntityType(this.getGlobalFilter());
                var oReturnFilter = this._checkRelevantFiltersRecursive(oEntityType.property, aFilters[0], oEntityType.name, entityType, oEntityModel, oFilterModel);
                //Wrap the return filter in an array
                if (oReturnFilter) {
                    oReturnFilterWrap.push(oReturnFilter);
                }
            }
            return oReturnFilterWrap;
        },

        /*
         Check derived Card Component is implemented with respect to the below restrictions:

         Custom card must be instance of sap.ovp.cards.generic.Component. In other words, custom card must extend sap.ovp.cards.generic.Component.
         If sap.ovp.cards.generic.Card view is replaced by another custom View it means the custom card is not valid.
         [If the extended Component has customization (under the component metadata) and the sap.ovp.cards.generic.Card is replaced by another view (using sap.ui.viewReplacements)]
         If the extended Component overrides the createContent function of the base sap.ovp.cards.generic.Component class, the custom card is not valid.
         If the extended Component overrides the getPreprocessors function of the base sap.ovp.cards.generic.Component class, the custom card is not valid.

         */
        _checkIsCardValid: function (sCardTemplate) {
            var sComponentClassName = sCardTemplate + ".Component";
            sap.ui.require(sComponentClassName);
            var oComponentClass = ObjectPath.get(sComponentClassName);

            if (!oComponentClass) {
                return false;
            }

            if (
                oComponentClass !== Component &&
                !(oComponentClass.prototype instanceof Component || oComponentClass.prototype instanceof ComponentV4)
            ) {
                return false;
            }
            
            //if OVP Card view was replaced
            var oViewRplacementExtension = oComponentClass.prototype.getCustomizing("sap.ui.viewReplacements");

            if (oViewRplacementExtension && oViewRplacementExtension["sap.ovp.cards.generic.Card"]) {
                return false;
            }
            if (
                oComponentClass.prototype.createContent != Component.prototype.createContent &&
                oComponentClass.prototype.createContent != ComponentV4.prototype.createContent
            ) {
                return false;
            }

            if (
                oComponentClass.prototype.getPreprocessors != Component.prototype.getPreprocessors &&
                oComponentClass.prototype.getPreprocessors != ComponentV4.prototype.getPreprocessors
            ) {
                return false;
            }

            return true;
        },

        _createCardComponent: function (oView, oModel, card) {
            /**
             * Tenperory change so that we can see the loading cards.
             * Disabling creation of the original cards.
             */
            // if (card.template && card.template !== "sap.ovp.cards.loading") {
            //     return;
            // }
            var oi18nModel = oView.getModel("@i18n");
            if (card.template && this._checkIsCardValid(card.template)) {
                var oComponentConfig = {
                    name: card.template,
                    manifest: false,
                    componentData: {
                        model: oModel,
                        modelName: card.model,
                        i18n: oi18nModel,
                        cardId: card.id,
                        settings: card.settings,
                        appComponent: this.getOwnerComponent(),
                        mainComponent: this
                    }
                };
                var oGlobalFilter = this.getGlobalFilter();

                if (card.errorReason) {
                    oComponentConfig.componentData.errorReason = card.errorReason;
                }
                if (oGlobalFilter) {
                    oComponentConfig.componentData.globalFilter = {
                        getUiState: oGlobalFilter.getUiState.bind(oGlobalFilter)
                    };
                }

                //Component creation will be done asynchronously
                var oThatView = oView;
                this.getOwnerComponent().runAsOwner(function () {
                    CoreComponent.create(oComponentConfig).then(function (oComponent) {
                        var sCardId = oComponent.getComponentData().cardId;
                        var oComponentContainer = oThatView.byId(sCardId);
                        oComponentContainer.setPropagateModel(true);
                        var oOldCard = oComponentContainer.getComponentInstance();

                        //Add the card component to the container
                        oComponentContainer.setComponent(oComponent);

                        //Destroy any old card
                        if (oOldCard) {
                            //currently the old component is not destroyed when setting a different component
                            //so we need to do that in timeout to make sure that it will not be destroyed
                            //too early, before real card will be rendered on the screen.
                            setTimeout(function () {
                                oOldCard.destroy();
                            }, 0);
                        }
                    });
                });
            } else {
                // TODO: define the proper behavior indicating a card loading failure
                oLogger.error("Could not create Card from '" + card.template + "' template. Card is not valid.");
            }
        },

        createErrorCard: function (card, reason) {
            var errorCard = merge({}, card, {
                template: "sap.ovp.cards.error"
            });
            errorCard.errorReason = Object.assign({}, reason);
            errorCard.settings.oldTemplate = card.template;
            errorCard.settings.template = "sap.ovp.cards.error";
            /*  Added to wait for the promise to be fulfilled before calling _createCardComponent() to fix 
             console error - Could not create Card from 'sap.ovp.cards.error' template. Card is not valid.  */
            this.oLoadedComponents[errorCard.settings.template].then(function () {
                this._createCardComponent(this.getView(), undefined, errorCard);
            }.bind(this));
        },

        observeCardSection: function (oCard) {
            if (oCard) {
                this.aObservedCards.push(oCard);
                var oCardDomRef = this.getView().byId(oCard.id).getDomRef();
            }

            if (!this._cardIntersectionObserver) {
                this._cardIntersectionObserver = new window.IntersectionObserver(function (aEntries) {
                    aEntries.forEach(function (oEntry) {
                        if (oEntry.isIntersecting) {
                            var oTargetedCard = this.aObservedCards.filter(function(card){
                                var oTargetedCardView = this.getView().byId(card.id);
                                return oTargetedCardView && oTargetedCardView.getDomRef() === oEntry.target;
                            }.bind(this))[0];
                            if (oTargetedCard) {
                                this._initCardModel(oTargetedCard.model);
                                this._loadCardComponent(oTargetedCard.template); //Load Card template files
                                this._createModelViewMap(oTargetedCard);
                                this.createCard(oTargetedCard);
                                var oTargetedCardDomRef = this.getView().byId(oTargetedCard.id).getDomRef();
                                this._cardIntersectionObserver.unobserve(oTargetedCardDomRef);
                            }
                        }
                    }.bind(this));
                }.bind(this), { threshold: 0 });
            }
            if (oCardDomRef) {
                this._cardIntersectionObserver.observe(oCardDomRef);
            }
        },

        createCard: function (card) {
            var oView = this.getView();
            var oModel = oView.getModel(card.model);
            ///*
            // * we have to make sure metadata and filter are loaded before we create the card
            // * so we first create loading card and once all promises will be resulved
            // * we will create the real card and replace the loading card
            // */

            var promiseArray;
            // v4
            if (CommonUtils.isODataV4(oModel)) {
                promiseArray = [oModel.getMetaModel().requestObject("/" + card.settings.entitySet), this.oGlobalFilterLoadedPromise, this.oLoadedComponents[card.template]];
            } else {
                promiseArray = [oModel.getMetaModel().loaded(), this.oGlobalFilterLoadedPromise, this.oLoadedComponents[card.template], this.oLoadedComponents["sap.ovp.cards.error"]];
            }
            return Promise.all(promiseArray).then(
                function () {
                    this._createCardComponent(oView, oModel, card);
                }.bind(this),
                function (reason) {
                    oLogger.error("Can't load card with id:'" + card.id + "' and type:'" + card.template + "', reason:" + reason);
                }
            );
        },

        /**
         * The function gets an UI5 generated id and returns the element original Id
         *
         * @param {string} generatedId - the UI5 generated id
         * @param {string} elementId - the element original  id
         */
        _getCardId: function (generatedId) {
            var appIdString = this.getView().getId() + "--";
            var sMainViewId = "mainView--";

            if (generatedId.indexOf(appIdString) != -1) {
                var start = generatedId.indexOf(appIdString) + appIdString.length;
                return generatedId.substring(start);
            }
            if (generatedId.indexOf(sMainViewId) !== -1) {
                var start = generatedId.indexOf(sMainViewId) + sMainViewId.length;
                return generatedId.substring(start);
            }
            return generatedId;
        },

        _initFlexibilityPersonalization: function () {
            var oLayout = this.getLayout();
            var flexibilityPath = "sap/ovp/flexibility/changeHandler/PersonalizationChangeHandler";
            var aOrderedCards = oLayout.getContent();

            if (aOrderedCards && aOrderedCards.length) {
                for (var i = 0; i < aOrderedCards.length; i++) {
                    aOrderedCards[i].addCustomData(
                        new CustomData({
                            key: "sap-ui-custom-settings",
                            value: {
                                "sap.ui.fl": {
                                    flexibility: flexibilityPath
                                }
                            }
                        })
                    );
                }
                //BCP 2380077387 Added to prevent superfluous $batch calls for the cards hidden via changeType hideCardContainer, when coming from another application
                aOrderedCards.push(oLayout);
                this.oFlexibilityPersonalizationPromise = new Promise(
                    function (resolve, reject) {
                        // ensure getting the changes and only then proceed forward
                        FlexRuntimeInfoAPI.waitForChanges({ selectors: aOrderedCards }).then(
                            function () {
                                if (this.deltaChanges.length > 0) {
                                    this.bDeltaChangesEnabled = true;
                                }
                                resolve();
                            }.bind(this),
                            function (oError) {
                                // No Lrep
                                // We resolve even in error scenario as the changes will be fetched from Vaiant
                                // TODO: Check from UX for error handling if message is to be shown on UI.
                                resolve();
                            }
                        );
                    }.bind(this)
                );
            }
        },

        layoutChanged: function (oEvent) {
            // remove duplicate card entries, reduce number of changes, one change per affected card
            var aChanges = oEvent.getParameter("positionChanges");
            var aChangesForSave = [],
                aCheckedChanges = [];
            var oChange, sCardId;
            if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                var iColCount = this.getLayout().dashboardLayoutUtil.dashboardLayoutModel.iColCount;
                if (aChanges) {
                    for (var i = aChanges.length - 1; i >= 0; i--) {
                        oChange = aChanges[i];
                        sCardId = oChange.content.cardId;
                        if (
                            oChange.content.dashboardLayout.oldRow === oChange.content.dashboardLayout.row &&
                            oChange.content.dashboardLayout.oldColumn === oChange.content.dashboardLayout.column &&
                            oChange.content.dashboardLayout.oldRowSpan === oChange.content.dashboardLayout.rowSpan &&
                            oChange.content.dashboardLayout.oldColSpan === oChange.content.dashboardLayout.colSpan
                        ) {
                            continue;
                        }
                        if (aCheckedChanges[sCardId]) {
                            aCheckedChanges[sCardId].content.dashboardLayout.oldRow = oChange.content.dashboardLayout.oldRow;
                            continue;
                        }
                        aCheckedChanges[sCardId] = oChange;
                    }
                    Object.keys(aCheckedChanges).forEach(function (sKey) {
                        var oChange = aCheckedChanges[sKey];
                        if (
                            oChange.content.dashboardLayout.oldRow === oChange.content.dashboardLayout.row &&
                            oChange.content.dashboardLayout.oldColumn === oChange.content.dashboardLayout.column &&
                            oChange.content.dashboardLayout.oldRowSpan === oChange.content.dashboardLayout.rowSpan &&
                            oChange.content.dashboardLayout.oldColSpan === oChange.content.dashboardLayout.colSpan
                        ) {
                            return;
                        }
                        aChangesForSave.push(aCheckedChanges[sKey]);
                    });
                    // move the values to column level
                    aChangesForSave.forEach(function (oChange) {
                        var oTemp = oChange.content.dashboardLayout;
                        oChange.content.dashboardLayout = {};
                        oChange.content.dashboardLayout["C" + iColCount] = oTemp;
                    });
                }
            } else {
                // to maintain the restore/reset functionality in Manage Cards scenario, update the aOrderedCards
                // TODO: enable/disable to restore/reset button can be improved with a flag updated on personalization save.
                var aContent = this.getLayout().getContent();
                var aOrderedCards = this._getCardArrayAsVariantFormat(aContent);
                this.getView().getModel("ui").setProperty("/aOrderedCards", aOrderedCards);
                aChangesForSave = aChanges;
            }
            if (aChangesForSave.length > 0) {
                PersonalizationUtils.savePersonalization(aChangesForSave, this.getView());
            }
        },

        /**
         * As of 1708,
         * the personalization will use savePersonalization.
         */
        saveVariant: function (oEvent) {
            var that = this;
            this.smartVariandManagement.getVariantsInfo(function (aVariants) {
                var oPersonalisationVariantKey = null;
                if (aVariants && aVariants.length > 0) {
                    oPersonalisationVariantKey = aVariants[0].key;
                }
                var bOverwrite = oPersonalisationVariantKey !== null;
                var oParams = {
                    name: "Personalisation",
                    global: false,
                    overwrite: bOverwrite,
                    key: oPersonalisationVariantKey,
                    def: true
                };
                that.smartVariandManagement.fireSave(oParams);
            });
        },

        getLayout: function () {
            return this.getView() ? this.getView().byId("ovpLayout") : null;
        },

        _initShowHideCardsButton: function () {
            // code changes based on the inputs from the FLP team - incident #1770148144
            var oRenderer = sap.ushell.Container.getRenderer("fiori2");
            if (oRenderer) {
                var manageCardsButton = {
                    controlType: "sap.ushell.ui.launchpad.ActionItem",
                    bCurrentState: true,
                    oControlProperties: {
                        icon: "sap-icon://dimension",
                        id: this.createId("managecards"),
                        text: OvpResources.getText("MANAGE_CARDS_TITLE"),
                        tooltip: OvpResources.getText("MANAGE_CARDS_TITLE"),
                        press: this.oManageCardsUtils.onManageCardsMenuButtonPress.bind(this.oManageCardsUtils)
                    },
                    bIsVisible: true,
                    aStates: ["app"]
                };
                oRenderer.addUserAction(manageCardsButton);
            }
        },

        createOrDestroyCards: function (aOldContent, aNewContent, bResetInDashboardLayout) {
            var oldIndex = -1,
                aCreateOrDestroyCards = [],
                aVisibleCards = [];

            for (var i = 0; i < aNewContent.length; i++) {
                //In case the card position has been changed, we need to get the card index in the old array.
                //Otherwise, the new and the old position are the same
                if (aOldContent[i].id == aNewContent[i].id) {
                    oldIndex = i;
                } else {
                    oldIndex = this.getCardIndexInArray(aOldContent, aNewContent[i].id);
                }
                var oOldComponentContainer = this.getView().byId(aNewContent[i].id);
                var oOldCard = oOldComponentContainer.getComponentInstance();
                if (bResetInDashboardLayout) {
                    if (oOldCard) {
                        oOldCard.destroy();
                    }
                }
                if (aNewContent[i].visibility != aOldContent[oldIndex].visibility || bResetInDashboardLayout) {
                    if (aNewContent[i].visibility === true) {
                        var oCardRef = this._getCardFromManifest(aNewContent[i].id);
                        aCreateOrDestroyCards.push({
                            oCard: oCardRef,
                            sCreateOrDestroy: "create"
                        });
                        aVisibleCards.push(oCardRef);
                    } else if (oOldCard) {
                        aCreateOrDestroyCards.push({
                            oCard: oOldCard,
                            sCreateOrDestroy: "destroy"
                        });
                    }
                }
            }
            var oTabIndexList = this.fGetViewSwitchIndex(aVisibleCards);
            if (aCreateOrDestroyCards && aCreateOrDestroyCards.length > 0) {
                var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
                for (var j = 0; j < aCreateOrDestroyCards.length; j++) {
                    if (
                        aCreateOrDestroyCards[j] &&
                        aCreateOrDestroyCards[j].oCard &&
                        aCreateOrDestroyCards[j].hasOwnProperty("sCreateOrDestroy") &&
                        aCreateOrDestroyCards[j].sCreateOrDestroy == "create"
                    ) {
                        var oCard = aCreateOrDestroyCards[j].oCard;
                        if (oCard) {
                            oCard.settings.baseUrl = this._getBaseUrl();
                            this._clearStoredEntities(); //Clear previously temporarily stored entity types
                            this._initCardModel(oCard.model);
                            oCard = this._getTemplateForChart(oCard);
                            this._loadCardComponent(oCard.template);
                            this._createModelViewMap(oCard);
                            if (oCard.settings.tabs) {
                                var iIndex = 0;
                                var oCards = [];
                                oCards.push(oCard);
                                var nIndex = oTabIndexList && oTabIndexList.hasOwnProperty(oCard.id) ? oTabIndexList[oCard.id] : "";
                                var nCurrentIndex = this.getOrderedCardsSelectedKey(oCard.id);
                                if (nIndex && typeof nIndex == "number" && nIndex <= oCard.settings.tabs.length && nIndex !== nCurrentIndex) {
                                    iIndex = nIndex >= 1 ? nIndex - 1 : nIndex;
                                    this.setOrderedCardsSelectedKey(oCard.id, nIndex);
                                } else if (aOrderedCards[j].selectedKey && oCard.settings.tabs.length >= aOrderedCards[j].selectedKey) {
                                    iIndex = aOrderedCards[j].selectedKey - 1;
                                }
                                this.initializeTabbedCard(oCard, iIndex);
                            }
                            this.createCard(oCard);
                        }
                    } else if (
                        aCreateOrDestroyCards[j] &&
                        aCreateOrDestroyCards[j].oCard &&
                        aCreateOrDestroyCards[j].hasOwnProperty("sCreateOrDestroy") &&
                        aCreateOrDestroyCards[j].sCreateOrDestroy == "destroy"
                    ) {
                        aCreateOrDestroyCards[j].oCard.destroy();
                    }
                }
            }
        },

        getCardIndexInArray: function (aCardsArr, cardId) {
            for (var i = 0; i < aCardsArr.length; i++) {
                if (aCardsArr[i].id == cardId) {
                    return i;
                }
            }
            return -1;
        },

        //?
        rerenderCards: function (aDialogCards) {
            var aOrderedCards = this.getView().getModel("ui").getProperty("/aOrderedCards");
            this.createOrDestroyCards.apply(this, [aOrderedCards, aDialogCards, false]);
            this.getView().getModel("ui").setProperty("/aOrderedCards", aDialogCards);
            this.updateDashboardLayoutCards(aDialogCards);
            this.updateLayoutWithOrderedCards();
            PersonalizationUtils.savePersonalization(this.visibilityChanges, this.getView());
            // remove error cards which are hidden
            for (var i = 0; i < aDialogCards.length; i++) {
                var oCard = aDialogCards[i];
                var iCardIndex = this.aErrorCards.indexOf(oCard.id);
                if (iCardIndex > -1 && oCard.visibility == false) {
                    this.aErrorCards.splice(iCardIndex, 1);
                }
            }
        },

        isDragAndDropEnabled: function () {
            return !Device.system.phone;
        },

        getGlobalFilter: function () {
            if (!this.oGlobalFilter) {
                this.oGlobalFilter = this.getView().byId("ovpGlobalFilter");
            }
            return this.oGlobalFilter;
        },

        getMacroFilterBar: function () {
            if (!this.oMacroFilterBar) {
                this.oMacroFilterBar = this.getView().byId("ovpGlobalMacroFilter");
            }
            return this.oMacroFilterBar;
        },

        getUIModel: function () {
            if (!this.oUIModel) {
                var oOwnerComponent = this.getOwnerComponent();
                this.oUIModel = oOwnerComponent && oOwnerComponent.getModel("ui");
            }
            return this.oUIModel;
        },

        _parseNavigationVariant: function () {
            //Navigation handler constructor uses ushell container to retrieve app
            //services, without container the instance creation will fall with error
            if (!this.oContainer) {
                this.oParseNavigationPromise = Promise.resolve();
                return;
            }
            var oNavigationHandlerr = this.oNavigationHandler;
            this.oParseNavigationPromise = new Promise(function (resolve, reject) {
                return oNavigationHandlerr
                    .parseNavigation()
                    .done(function (oAppData, oURLParameters, sNavType) {
                        resolve([oAppData, oURLParameters, sNavType]);
                    })
                    .fail(function () {
                        reject();
                    });
            });
        },

        /**
         *
         * @param oSelectionVariant
         * @param aSelVarProperties
         * @param bReplace - false means do not reset existing filter bar
         * @returns an array of selection variant properties to be added to SFB advanced area
         * @private
         */
        _setUiStateToGlobalFilter: function (oSelectionVariant, aSelVarProperties, bReplace) {
            var oGlobalFilter = this.getGlobalFilter();
            var oUiState = new UIState({
                selectionVariant: oSelectionVariant.toJSONObject()
            });
            oGlobalFilter.setUiState(oUiState, {
                replace: bReplace,
                strictMode: false
            });

            aSelVarProperties = aSelVarProperties.concat(oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames()));
            aSelVarProperties = aSelVarProperties.filter(function (item, pos, self) {
                return self.indexOf(item) == pos;
            });

            return aSelVarProperties;
        },

        /**
         * This function calls the extension defined by the developer to include additional selection variant
         * properties at the start of the application
         * @param aSelVarProperties
         * @returns {*}
         * @private
         */

        _processModifyStartupExtension: function (aSelVarProperties) {
            if (!aSelVarProperties) {
                aSelVarProperties = [];
            }

            var oGlobalFilter = this.getGlobalFilter();
            var oUiState = oGlobalFilter.getUiState();
            var oCustomSelectionVariant = new SelectionVariant(oUiState.getSelectionVariant());
            var oOriginalSelectionVariant = JSON.parse(JSON.stringify(oCustomSelectionVariant));

            return new Promise(
                function (resolve, reject) {
                    Promise.all([
                        this.modifyStartupExtension(oCustomSelectionVariant),
                        this.templateBaseExtension.provideStartupExtension(oCustomSelectionVariant) //This enables custom iAppState handling using extensibility method.
                    ]).then(
                        function () {
                            if (JSON.stringify(oCustomSelectionVariant) !== JSON.stringify(oOriginalSelectionVariant)) {
                                try {
                                    aSelVarProperties = this._setUiStateToGlobalFilter(oCustomSelectionVariant, aSelVarProperties, true);
                                } catch (err) {
                                    oLogger.error("Error with modifyStartupExtension, falling back to default behavior" + err);
                                    aSelVarProperties = this._setUiStateToGlobalFilter(oOriginalSelectionVariant, aSelVarProperties, true);
                                }
                            }
                            resolve(aSelVarProperties);
                        }.bind(this)
                    );
                }.bind(this)
            );
        },

        _addFieldsToSFBAdvancedArea: function (aSelVarProperties) {
            var iLength;
            var oGlobalFilter = this.getGlobalFilter();
            if (aSelVarProperties && aSelVarProperties.length > 0) {
                //Add field to visible filter bar
                iLength = aSelVarProperties.length;
                while (iLength--) {
                    oGlobalFilter.addFieldToAdvancedArea(aSelVarProperties[iLength]);
                }
            }
        },
        // method is responsible for retrieving state for all extensions.
        // More precisely, oExtensionData is a map Extension-namespace -> state that has been stored by the corresponding extension.
        // This method enables each extension to restore its state accordingly.
        _restoreAppState: function (oCustomData) {
            this.restoreCustomAppStateDataExtension(oCustomData._CUSTOM);
            var oExtensionData = oCustomData._EXTENSION;
            if (!oExtensionData) {
                return; // the app-state does not contain state information for extensions
            }
            var bIsAllowed = true; // check for synchronous calls
            // the following function will be passed to all extensions. It gives them the possibility to retrieve their state.
            // Therefore, they must identify themselves via their instance of ControllerExtension.
            var fnGetAppStateData = function (oControllerExtension) {
                if (!(oControllerExtension instanceof ControllerExtension)) {
                    throw new Error("State must always be retrieved with respect to a ControllerExtension");
                }
                var sExtensionId = oControllerExtension.getMetadata().getNamespace();
                if (!bIsAllowed) {
                    throw new Error("State must always be restored synchronously");
                }
                return oExtensionData[sExtensionId];
            };
            this.templateBaseExtension.restoreExtensionAppStateData(fnGetAppStateData);
            bIsAllowed = false;
        },
        /*
         Applies the filters when returning/navigating to OVP from an external application or
         when the filters are passed as URL parameters
         */
        _setNavigationVariantToGlobalFilter: function (oAppData, oURLParameters, sNavType) {
            return new Promise(
                function (resolve, reject) {
                    var oGlobalFilter = this.getGlobalFilter();
                    var oData = this.getUIModel() && this.getUIModel().oData;
                    var oSmartFilterbar = this.oState && this.oState.oSmartFilterbar;
                    var semanticDates = this.oGlobalFilter && this.oGlobalFilter.getUiState().getSemanticDates();

                    if (!oGlobalFilter) {
                        return;
                    }

                    //Based on navigation type, process the parameters
                    switch (sNavType) {
                        //iAppState triggered on back navigation
                        case "iAppState":
                            if (this.getUIModel() && this.getUIModel().getProperty("/bRTAActive")) {
                                resolve();
                                break;
                            }
                            //Non Custom data handling

                            if (oAppData.selectionVariant) {
                                var oCurrentVariant = JSON.parse(oAppData.selectionVariant);
                                if (oCurrentVariant.SelectionVariantID.length !== 0) {
                                    var aAllVariantKeys = oGlobalFilter
                                        .getVariantManagement()
                                        .getVariantItems()
                                        .map(function (item) {
                                            return item.getKey();
                                        });
                                    var sCurrentVariantId = oCurrentVariant.SelectionVariantID;
                                    if (aAllVariantKeys.indexOf(sCurrentVariantId) === -1) {
                                        resolve();
                                        break;
                                    }
                                }
                                var oSelectionVariant,
                                    aSelectionVariantProperties,
                                    bMarkDirty = false;
                                var oUnsavedData, oSavedData, oUnsavedDataCustom, oSavedDataCustom;
                                var oUiState, oSavedUiState, oUnsavedUiState;
                                //Clear the global filter variant
                                oGlobalFilter.clearVariantSelection();
                                //Set the original variant by reading from application data, when the variant
                                //is set, the corresponding filters and models and data suite for that variant
                                //are automatically set
                                oCurrentVariant = JSON.parse(oAppData.selectionVariant);
                                oGlobalFilter.setCurrentVariantId(oCurrentVariant.SelectionVariantID);
                                //Get the data suite for the original variant, this was saved data of variant
                                oSavedUiState = oGlobalFilter.getUiState({
                                    allFilters: false
                                });
                                oSavedData = oSavedUiState && JSON.stringify(oSavedUiState.getSelectionVariant()); //SAVED
                                //Get the custom data for the original variant, this was saved data of variant
                                oSavedDataCustom = oGlobalFilter.getFilterData()._CUSTOM; //SAVED CUSTOM
                                oSavedDataCustom = typeof oSavedDataCustom == "undefined" ? {} : oSavedDataCustom;
                                //Set the data suite again from app data so as to apply any unsaved changes
                                //to the variant
                                oUiState = new UIState({
                                    selectionVariant: oAppData.oSelectionVariant.toJSONObject(),
                                    semanticDates: oAppData.semanticDates
                                });
                                oGlobalFilter.setUiState(oUiState, {
                                    replace: true,
                                    strictMode: false
                                });

                                //Get the selection properties from the app data to be put in the filter bar
                                oSelectionVariant = new SelectionVariant(oAppData.selectionVariant);
                                aSelectionVariantProperties = oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames());

                                for (var i = 0; i < aSelectionVariantProperties.length; i++) {
                                    oGlobalFilter.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
                                }
                                // getting unsaved data after additional filters have been added in the above loop
                                oUnsavedUiState = oGlobalFilter.getUiState({
                                    allFilters: false
                                });
                                oUnsavedData = oUnsavedUiState && JSON.stringify(oUnsavedUiState.getSelectionVariant()); //UNSAVED
                                //Compare saved and unsaved data and mark the filter dirty accordingly
                                if (oSavedData !== oUnsavedData) {
                                    bMarkDirty = true;
                                }
                                //Custom Data Handling
                                if (oAppData.customData && Object.keys(oAppData.customData).length > 0) {
                                    var oUnsavedDataCustom = oAppData.customData; //UNSAVED CUSTOM
                                    this._restoreAppState(oUnsavedDataCustom);
                                    //Compare saved and unsaved for custom filters and mark the filter dirty accordingly
                                    if (JSON.stringify(oSavedDataCustom) !== JSON.stringify(oUnsavedDataCustom)) {
                                        bMarkDirty = true;
                                    }
                                }
                                oGlobalFilter.getSmartVariant().currentVariantSetModified(bMarkDirty);
                                //Though there are several public methods to update filter count, but to avoid any
                                //unnecessary processing, we are doing it directly
                                oGlobalFilter._updateToolbarText();
                            }
                            resolve();
                            break; //from switch case

                        case "xAppState":
                        case "URLParams":
                            // oAppData.oSelectionVariant contains the navigation selection variant
                            // oAppData.selectionVariant is just the string of oAppData.oSelectionVariant
                            // oAppData.oDefaultedSelectionVariant contains default selection variant, that comes
                            // from FLP user settings

                            /****** START OF RULES (how variants will be applied) ****************************************
                             *
                             *  1.  If there is a navigation variant present (oAppData.bNavSelVarHasDefaultsOnly = FALSE),
                             *      then clear the global filter completely (including variant selection) ignoring all other
                             *      incoming variants and defaults                         *
                             *  2.  If (oAppData.bNavSelVarHasDefaultsOnly = TRUE), this means oAppData will contains only
                             *      FLP user settings defaults, then following rules apply:
                             *
                             *      a. Global Filter initialized with user default variant, then ignore all others
                             *      b. Global Filter initialized with standard variant, then Load oAppData.oDefaultedSelectionVariant
                             *
                             * For case 2->b, Global Filter initialized with standard variant can contain default values
                             * coming from metadata. In that case, merge the user default values with standard variant values. The FLP default values take precedence.
                             *
                             * Display Currency parameter will get special attention : If after RULE 2a is
                             * executed and display currency parameter in filter bar remains empty, then populate display
                             * currency by first looking into oAppData.oDefaultedSelectionVariant and if not found, then
                             * from default metadata values
                             *
                             ******* END OF RULES ************************************************************************/
                            var aSelVarProperties = [];
                            var oNavigationVariant = new SelectionVariant(oAppData.oSelectionVariant.toJSONObject());
                            var oDefaultVariant = new SelectionVariant(oAppData.oDefaultedSelectionVariant.toJSONObject());

                            //RULE 1 (Check table comment above)
                            if (!oAppData.bNavSelVarHasDefaultsOnly && !oNavigationVariant.isEmpty()) {
                                //Reset existing filter bar completely
                                oGlobalFilter.clearVariantSelection();
                                oGlobalFilter.clear();
                                aSelVarProperties = this._setUiStateToGlobalFilter(oNavigationVariant, aSelVarProperties, true);
                            }

                            //RULE 2 (Check table comment above)
                            if (oAppData.bNavSelVarHasDefaultsOnly && !oDefaultVariant.isEmpty() && oGlobalFilter.getCurrentVariantId() === "") {
                                var mergedVariant = this._mergeDefaultWithSFBVariant(oDefaultVariant, new SelectionVariant(JSON.stringify(oGlobalFilter.getUiState().getSelectionVariant())));
                                aSelVarProperties = this._setUiStateToGlobalFilter(mergedVariant, aSelVarProperties, true);
                            }

                            //Set DisplayCurrency Parameter if left empty for user variant (after RULE 2a)
                            if (oGlobalFilter.getCurrentVariantId() !== "") {
                                this._setDisplayCurrency(oDefaultVariant);
                            }

                            Promise.resolve(this._processModifyStartupExtension(aSelVarProperties)).then(
                                function (aSelVarProperties) {
                                    this._addFieldsToSFBAdvancedArea(aSelVarProperties);
                                    if (this.oGlobalFilter.isCurrentVariantStandard() && oAppData.bNavSelVarHasDefaultsOnly !== false && this.oGlobalFilter.getSmartVariant()) {
                                        semanticDateRangeTypeHelper.setSemanticDateRangeDefaultValue(oData, oSmartFilterbar, semanticDates, oURLParameters || {});
                                        this.oGlobalFilter.getSmartVariant().currentVariantSetModified(false);
                                    }
                                    resolve();
                                }.bind(this)
                            );
                            break; //from switch case

                        case "initial":
                            Promise.resolve(this._processModifyStartupExtension()).then(
                                function (aSelVarProperties) {
                                    this._addFieldsToSFBAdvancedArea(aSelVarProperties);
                                    if (this.oGlobalFilter.isCurrentVariantStandard() && oAppData.bNavSelVarHasDefaultsOnly !== false && this.oGlobalFilter.getSmartVariant()) {
                                        semanticDateRangeTypeHelper.setSemanticDateRangeDefaultValue(oData, oSmartFilterbar, semanticDates, oURLParameters || {});
                                        this.oGlobalFilter.getSmartVariant().currentVariantSetModified(false);
                                    }
                                    resolve();
                                }.bind(this)
                            );
                            break; //from switch case
                        default:
                            break;
                    }
                }.bind(this)
            );
        },

        /**
         * This function makes a copy of the variant of a smart filter bar, and merges it with the user default parameters from FLP
         *
         * @param {object} oDefaultParamsVariant variant with default params provided by FLP
         * @param {object} oSFBSelectionVariant standard variant of the smart filter bar
         *
         * @returns {object} a new merged selection variant with default properties taking priority.
         */
        _mergeDefaultWithSFBVariant: function (oDefaultParamsVariant, oSFBSelectionVariant) {
            if (oDefaultParamsVariant.isEmpty()) {
                return oSFBSelectionVariant;
            }

            var oMergedVariant = new SelectionVariant();
            var aVariantOptions, aVariantParameters;
            [oSFBSelectionVariant, oDefaultParamsVariant].forEach(function (oVariant) {
                // copy selection options
                aVariantOptions = oVariant.getSelectOptionsPropertyNames();
                aVariantOptions.forEach(function (sProperty) {
                    oMergedVariant.removeSelectOption(sProperty);
                    // This is to avoid SelectionVariant.PARAMETER_SELOPT_COLLISION ERROR if another SelectOption with the same name as the Parameter already exists
                    if (!oMergedVariant.getParameter(sProperty)) {
                        oMergedVariant.massAddSelectOption(sProperty, oVariant.getSelectOption(sProperty));
                    }
                });
                // copy parameters
                aVariantParameters = oVariant.getParameterNames();
                aVariantParameters.forEach(function (sParam) {
                    oMergedVariant.removeParameter(sParam);
                    // This is to avoid SelectionVariant.PARAMETER_SELOPT_COLLISION ERROR if another Parameter with the same name as the SelectOption already exists
                    if (!oMergedVariant.getSelectOption(sParam)) {
                        oMergedVariant.addParameter(sParam, oVariant.getParameter(sParam));
                    }
                });
            });

            return oMergedVariant;
        },

        /**
         * This function checks if DisplayCurrency parameter is left empty
         * If yes, it tries to set it first from user default settings then
         * from metadata defaults
         * @param oDefaultVariant
         * @private
         */
        _setDisplayCurrency: function (oDefaultVariant) {
            var oGlobalFilter = this.getGlobalFilter();
            if (!oGlobalFilter) {
                return;
            }
            //Check if any analytical parameter present with name DisplayCurrency
            var iLength, oDisplayCurrency;
            var aParameters = oGlobalFilter.getAnalyticalParameters();
            if (aParameters && aParameters.length > 0) {
                iLength = aParameters.length;
                while (iLength--) {
                    if (aParameters[iLength].name === "P_DisplayCurrency" || aParameters[iLength].name === "DisplayCurrency") {
                        oDisplayCurrency = aParameters[iLength];
                        break;
                    }
                }
            }
            //There is no parameter for DisplayCurrency in filter bar
            if (!oDisplayCurrency) {
                return;
            }
            //If DisplayCurrency present and already filled with value, then do nothing
            //oDisplayCurrency.fieldName looks like $Parameter.P_DisplayCurrency
            var aFilters = oGlobalFilter.getFilters([oDisplayCurrency.fieldName]);
            var sDefaultValue = aFilters && aFilters[0] && aFilters[0].oValue1;
            if (sDefaultValue && sDefaultValue !== " ") {
                return;
            }
            //Read user settings defaults and try to populate DisplayCurrency Parameter
            //oDefaultVariant can contain the parameter value in SelectOption section as well, this
            //implementation is from navigation handler
            var sNameWithoutPrefix, sNameWithPrefix;
            if (oDisplayCurrency.name.indexOf("P_") === 0) {
                sNameWithPrefix = oDisplayCurrency.name;
                sNameWithoutPrefix = oDisplayCurrency.name.substr(2); // remove P_ prefix
            } else {
                sNameWithPrefix = "P_" + oDisplayCurrency.name;
                sNameWithoutPrefix = oDisplayCurrency.name;
            }
            if (oDefaultVariant && !oDefaultVariant.isEmpty()) {
                var oSelectOption;
                sDefaultValue = oDefaultVariant.getParameter(sNameWithoutPrefix);
                if (!sDefaultValue || sDefaultValue === " ") {
                    sDefaultValue = oDefaultVariant.getParameter(sNameWithPrefix);
                }
                if (!sDefaultValue || sDefaultValue === " ") {
                    oSelectOption = oDefaultVariant.getSelectOption(sNameWithoutPrefix);
                    sDefaultValue = oSelectOption && oSelectOption[0] && oSelectOption[0].Low;
                }
                if (!sDefaultValue || sDefaultValue === " ") {
                    oSelectOption = oDefaultVariant.getSelectOption(sNameWithPrefix);
                    sDefaultValue = oSelectOption && oSelectOption[0] && oSelectOption[0].Low;
                }
            }
            if (!sDefaultValue || sDefaultValue === " ") {
                sDefaultValue = oDisplayCurrency.defaultPropertyValue; //metadata default
            }
            if (!sDefaultValue || sDefaultValue === " ") {
                return; //not found at last
            }

            var oSelectionVariant = new SelectionVariant();
            oSelectionVariant.addParameter(oDisplayCurrency.name, sDefaultValue);
            var oUiState = new UIState({
                selectionVariant: oSelectionVariant.toJSONObject()
            });
            //replace false means do not reset existing filter bar
            //There always be a match found for parameter in filter bar so this will be applied to parameter only
            oGlobalFilter.setUiState(oUiState, {
                replace: false,
                strictMode: false
            });
        },

        /**
         * This function connects to application extension and retrieves the
         * custom appstate data
         * @returns {object}
         * @private
         */
        _getCustomAppState: function () {
            var oCustomData = {},
                oCustomAndGenericData = {};
            //Application has the option to return custom data or set the custom data
            //in the empty object handle provided, return data will get priority
            this.getCustomAppStateDataExtension(oCustomData);
            if (!isEmptyObject(oCustomData)) {
                oCustomAndGenericData[dataPropertyNameCustom] = oCustomData;
            }
            var oExtensionData; // collects all extension state information (as map extension-namespace -> state). Initialized on demand
            var bIsAllowed = true; // check for synchronous calls
            // the following function will be passed to all extensions. It gives them the possibility to provide their state as oAppState
            // Therefore, they must identify themselves via their instance of ControllerExtension.
            var fnSetAppStateData = function (oControllerExtension, oAppState) {
                if (!(oControllerExtension instanceof ControllerExtension)) {
                    throw new Error("State must always be set with respect to a ControllerExtension");
                }
                if (!bIsAllowed) {
                    throw new Error("State must always be provided synchronously");
                }
                if (oAppState) {
                    // faulty app-state information will not be stored
                    oExtensionData = oExtensionData || Object.create(null);
                    var sExtensionId = oControllerExtension.getMetadata().getNamespace(); // extension is identified by its namespace
                    oExtensionData[sExtensionId] = oAppState;
                }
            };
            this.templateBaseExtension.provideExtensionAppStateData(fnSetAppStateData);
            bIsAllowed = false;
            if (oExtensionData) {
                oCustomAndGenericData[dataPropertyNameExtension] = oExtensionData;
            }
            return oCustomAndGenericData;
        },

        /**
         * Event handler before variant is saved
         */
        onBeforeSFBVariantSave: function () {
            // Before variant is saved, store the custom filter data
            var oCustomData = this._getCustomAppState();
            var oFilterData = this.getGlobalFilter().getFilterData();
            // workaround since getFilterData() does not provide the content of the search field:
            var sSearchFieldValue,
                oBasicSearchField = this.getGlobalFilter().getBasicSearchControl();
            if (oBasicSearchField && oBasicSearchField.getValue) {
                sSearchFieldValue = oBasicSearchField.getValue();
            }
            oFilterData._CUSTOM = oCustomData[dataPropertyNameCustom];
            oFilterData._EXTENSION = oCustomData[dataPropertyNameExtension];
            this.getGlobalFilter().setFilterData(oFilterData, true);
            if (sSearchFieldValue) {
                // the previous statement has blanked the content of the search field -> reset it to the stored value
                this.getGlobalFilter().getBasicSearchControl().setValue(sSearchFieldValue);
            }
            this.getGlobalFilter().fireFilterChange();
        },

        /**
         * Event handler after variant is loaded
         */
        onAfterSFBVariantLoad: function () {
            var oData = this.getGlobalFilter().getFilterData();
            //Added to fix filters not getting applied when variants are switched when enableLiveFilter is true
            var bLiveMode = this.getUIModel().getProperty("/enableLiveFilter");
            if (bLiveMode) {
                this.getGlobalFilter().fireFilterChange();
            }
            if (oData) {
                this._restoreAppState(oData);
            }
        },

        /**
         * Event handler to change the snapped header text when the filters change
         * @param oEvent
         */
        onAssignedFiltersChanged: function (oEvent) {
            if (oEvent.getSource() && this.getView().byId("ovpFilterText")) {
                this.getView().byId("ovpFilterText").setText(oEvent.getSource().retrieveFiltersWithValuesAsText());
            }
        },
        /**
         * Storing values from custom filter and extension filter in an object
         */
        _CustomFilterField: function (oValues, oCustomSelectionVariantData) {
            for (var key in oValues) {
                if (oValues.hasOwnProperty(key)) {
                    oCustomSelectionVariantData[key] = oValues[key];
                }
            }
        },

        /**
         * Create an app state key using app state data and update url with iAppstate
         * @param oEvent : Event object if the function was triggered by dialog close
         * @param bVariantManagementSaved    :  Boolean flag to prevent custom filters being set if triggered by variant management save
         * @private
         */
        _storeCurrentAppStateAndAdjustURL: function (oEvent, bVariantManagementSaved) {

            //do not apply iappState while adaptation is active
            if (this.getUIModel() && this.getUIModel().getProperty("/bRTAActive")) {
                return;
            }
            if (oEvent && !oEvent.oSource._bDirtyViaDialog) {
                return;
            }

            if (!this.bGlobalFilterLoaded) {
                return;
            }

            //Without navigation handler instance, app state cannot be created
            if (!this.oNavigationHandler) {
                return;
            }
            // Success handler for IAppStateHandler.oAppStatePromise
            var fnFulfilled = function (sAppStateKey) {
                IAppStateHandler.oAppStatePromise = null; // Nullified so that we can find out later that this is not pending
                if (sAppStateKey && sAppStateKey.length > 0) {
                    this.oNavigationHandler.replaceHash(sAppStateKey);
                    return;
                }
                throw "AppState key is empty";
            };

            // Failure handler for IAppStateHandler.oAppStatePromise
            var fnRejected = function (sError) {
                IAppStateHandler.oAppStatePromise = null;
                if (sError === "skip") {
                    throw sError; // "skip" means not actual error
                }
                throw "Something went wrong while storing AppState - " + sError;
            };

            IAppStateHandler.getCurrentAppStatePromise(bVariantManagementSaved, this)
                .then(fnFulfilled.bind(this), fnRejected.bind(this))
                //catch statement may be triggered even if there is failure in fnFulfilled
                .catch(function (sError) {
                    if (sError === "skip") {
                        return; //"skip" means not actual error
                    }
                    // oLogger.error(sError);
                });
        },

        /**
         * This function updates the title that needs to be shown if smartVariantRequired is set to false
         * Precedence is - subTitleIfVariantMgmtHidden > description > title
         */
        setTitle: function (subTitle, description, appTitle) {
            var updatedTitle = "";
            if (subTitle) {
                updatedTitle = subTitle;
            } else if (description) {
                updatedTitle = description;
            } else {
                updatedTitle = appTitle;
            }
            return updatedTitle;
        },

        onMacroFilterBarSearch: function (oEvent) {
            if (!this.bLoadDataOnMFBSearch) {
                this.bLoadDataOnMFBSearch = true;
                return;
            }
            this._collapseHeaderForPage();
            if (this.fnMacroFilterBarLoaded !== undefined) {
                this.fnMacroFilterBarLoaded();
                OVPUtils.loadingState.GLOBALFILTERFILLED = true;
                this.getView().byId("ovpFilterNotFulfilledPage").setVisible(false);
                this.bGlobalFilterLoaded = true;
            }
            this.bGoButtonPressed = true;
            var oOvpLayout = this.getLayout();
            if (oOvpLayout) {
                oOvpLayout.setActive(true);
            }
            if (this.aErrorCards && this.aErrorCards.length > 0) {
                this.destroyErrorCardsAndReplaceWithOriginal();
            }
            this._clearStoredEntities(); //Clear previously temporarily stored entity types
            if (oEvent) {
                this.aFilters = oEvent.getParameter("filters");
            }
            var sBatchGroupId = "ovp-" + new Date().getTime();
            for (var modelKey in this.oCardsModels) {
                if (this.oCardsModels.hasOwnProperty(modelKey) && !CommonUtils.isODataV4(this.oCardsModels[modelKey])) {
                    try {
                        this.oCardsModels[modelKey].refresh(false, false, sBatchGroupId);
                    } catch (err) {
                        oLogger.warning(err);
                    }
                }
            }
            this.globalEventBus.publish("OVPGlobalfilter", "OVPGlobalFilterSeacrhfired", this.aFilters);
            var bLiveMode = this.getUIModel().getProperty("/enableLiveFilter");
            if (!this.bSearchTriggeredManually && (!this.bInitialMacroFilterBarSearch || !bLiveMode)) {
                this._storeCurrentAppStateAndAdjustURL();
            } else {
                this.bSearchTriggeredManually = false;
                this.bInitialMacroFilterBarSearch = false;
            }
        }
    });
});
