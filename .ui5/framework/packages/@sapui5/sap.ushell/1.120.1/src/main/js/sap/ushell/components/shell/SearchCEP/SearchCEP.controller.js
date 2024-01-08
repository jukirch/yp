// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/List",
    "sap/m/Text",
    "sap/m/StandardListItem",
    "sap/ushell/components/shell/SearchCEP/SearchProviders/SearchProvider",
    "sap/base/Log",
    "sap/ushell/utils/WindowUtils",
    "sap/ui/thirdparty/jquery",
    "sap/ushell/resources",
    "sap/ui/Device",
    "sap/ui/core/Configuration",
    "sap/base/util/UriParameters",
    "sap/ui/core/Core",
    "sap/ushell/EventHub",
    "sap/m/Avatar"
], function (
    Controller,
    JSONModel,
    Fragment,
    List,
    Text,
    StandardListItem,
    SearchProvider,
    Log,
    WindowUtils,
    jQuery,
    resources,
    Device,
    Configuration,
    UriParameters,
    Core,
    EventHub,
    Avatar
) {
    "use strict";

    return Controller.extend("sap.ushell.components.shell.SearchCEP.SearchCEP", {

        onInit: function () {

            this._bIsMyHome = false;
            this._bEscPressed = false;
            this.bGrowingReset = false;
            this._SearchCEPService = sap.ushell.Container.getServiceAsync("SearchCEP");

            this._SearchCEPService.then(function (oSearchCEPService) {
                this._registerDefaultProviders(oSearchCEPService);
                this._listenToServiceEvents(oSearchCEPService);
            }.bind(this));

            this._toggleSearchPopover(false);

            this._oPlaceHolderSF = Core.byId("PlaceHolderSearchField");

            var sPlatform = sap.ushell.Container.getFLPPlatform(true);

            if (sPlatform === "MYHOME") {
                this._bIsMyHome = true;
            }
        },

        onSuggest: function (oEvent) {

            if (this._bEscPressed) {
                return;
            }

            this.oSF.focus();

            if (this.bOpeningPopOver === true && this._oPopover.isOpen() === true) {
                this.bOpeningPopOver = false;
                return;
            }

            var sValue = oEvent.getParameter("suggestValue");
            this._testProviders(sValue);
        },

        onfocusin: function (oEvent) {

            if (this.oSF.getEnableSuggestions() && Device.system.phone) {
                // eslint-disable-next-line no-undef
                jQuery(this.oSF.getDomRef()).find("input").attr("inputmode", "search");
                // eslint-disable-next-line no-undef
                jQuery(this._oPlaceHolderSF.getDomRef()).find("input").attr("inputmode", "search");
            }
        },

        onSearch: function (oEvent) {

            var sSearchTerm = oEvent.getParameter("query"),
                bEscPressed = oEvent.getParameter("escPressed"),
                bClearButtonPressed = oEvent.getParameter("clearButtonPressed"),
                oSearchResultList = Core.byId("SearchResultList");

            if (bEscPressed) {
                this._bEscPressed = bEscPressed;
                if (this.oSF.getValue() || this._oPlaceHolderSF.getValue()) {
                    this.oSF.setValue("");
                    this._oPlaceHolderSF.setValue("");
                } else {
                    this._oPopover.close();
                }
                return;
            }

            if (bClearButtonPressed) {

                this.oSF.setValue("");
                this._oPlaceHolderSF.setValue("");
                this.bOpeningPopOver = false;

                this._testProviders();

                var bClosePopover = true,
                    aLists = this._oPopover.getContent()[1].getItems();

                for (var nIdx in aLists) {
                    if (aLists[nIdx].getItems().length) {
                        bClosePopover = false;
                    }
                }

                if (bClosePopover) {
                    this._oPopover.close();
                }
                return;
            }

            if (sSearchTerm) {
                sSearchTerm = sSearchTerm.trim();
                // sync inputs in case esc was pressed and value was entered, cleared and another one entered
                this._oPlaceHolderSF.setValue(this.oSF.getValue());
                this._saveSearchTerm(sSearchTerm);

                if (this._bIsMyHome) {
                    if (oSearchResultList.getItems().length > 0) {

                        var oBindingContext = oSearchResultList.getItems()[0].getBindingContext("resultModel"),
                            oResult = oBindingContext.getObject();

                        this._navigateToApp(oResult);
                    }
                } else {
                    this._navigateToResultPage(sSearchTerm);
                }
                this._oPopover.close();
            }
        },

        onBeforeOpen: function () {

            var bCollapse = false,
                oShellHeader = Core.byId("shell-header"),
                sSearchState = oShellHeader.getSearchState();

            if (sSearchState === "COL") {
                bCollapse = true;
            }

            this._oPopover.addStyleClass("sapUshellCEPSearchFieldPopover");

            // intermediate state to force shell to show overlay
            oShellHeader.setSearchState("EXP", 35, false);
            oShellHeader.setSearchState("EXP_S", 35, true);

            if (bCollapse === true) {
                oShellHeader.setSearchState("COL", 35, false);
            }
        },

        onAfterOpen: function () {

            var nPlaceHolderSFHeight = document.getElementById("PlaceHolderSearchField").clientHeight;
            document.getElementById("CEPSearchField").style.height = nPlaceHolderSFHeight + "px";
            // add tooltip to CEP Search icon
            document.getElementById("CEPSearchField-search").title = resources.i18n.getText("search");
            // add tooltip to truncated list items
            var aListItemsTitles = document.querySelectorAll(".searchCEPList .sapMSLIDiv:not(.sapMGrowingListTriggerText)>.sapMSLITitleOnly");
            aListItemsTitles.forEach(function (oDiv) {
                if (oDiv.scrollWidth > oDiv.offsetWidth) {
                    oDiv.parentNode.parentNode.title = oDiv.innerText;
                }
            });
        },

        onAfterClose: function (oEvent) {

            var oSFicon = Core.byId("sf"),
                oShellHeader = Core.byId("shell-header"),
                sScreenSize = this._getScreenSize(),
                aLists = this._oPopover.getContent()[1].getItems();

            this._oPlaceHolderSF.setValue(this.oSF.getValue());

            if (this._bEscPressed) {
                this._bEscPressed = false;
                this._oPlaceHolderSF.focus();
            }

            if (sScreenSize !== "XL" && this.oSF.getValue() === "") {
                oShellHeader.setSearchState("COL", 35, false);
                oSFicon.setVisible();
            } else {
                // intermediate state to force shell to disable overlay
                oShellHeader.setSearchState("EXP", 35, false);
                oShellHeader.setSearchState("EXP_S", 35, false);
            }

            aLists.forEach(function (oList) {
                var oListConfig = oList._getProviderConfig(),
                    sGroupName = this._getDefaultProviderGroupName(oListConfig.id);
                // notify external search providers
                if (!sGroupName) {
                    if (typeof oListConfig.popoverClosed === "function") {
                        var fnPopoverClosedHandler = oListConfig.popoverClosed;
                        fnPopoverClosedHandler(oEvent);
                    }
                }
            }.bind(this));
        },

        getHomePageApps: function () {

            var sGroupName = "homePageApplications",
                oProductsProvider = SearchProvider.defaultProviders[sGroupName];

            oProductsProvider.execSearch("", sGroupName);
        },

        _listenToServiceEvents: function (oSearchCEPService) {

            EventHub.on("updateExtProviderLists").do(this._updateExtProviderLists.bind(this, oSearchCEPService));
        },

        _updateExtProviderLists: function (oSearchCEPService) {

            if (this._oPopover) {
                var oContent = this._oPopover.getContent()[1],
                    aLists = oContent.getItems(),
                    pExtProvidersPromise = oSearchCEPService.getExternalSearchProvidersPriorityArray();

                // remove external provider lists
                for (var idx in aLists) {
                    var oList = aLists[idx],
                        oProvider = oList._getProviderConfig(),
                        sGroupName = this._getDefaultProviderGroupName(oProvider.id);

                    if (!sGroupName) {
                        oContent.removeItem(oList);
                        oList.destroy();
                        this._oResultModel.setProperty("/" + oProvider.name, []);
                    }
                }

                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }

                // add external provider lists
                pExtProvidersPromise.then(function (aExtProviders) {
                    for (var indx in aExtProviders) {
                        var oExList = this._createList(aExtProviders[indx], undefined);
                        oExList.addStyleClass(this._sContentDensityClass);
                        oContent.addItem(oExList);
                    }

                    if (this._oPopover.isOpen()) {
                        // fill external provider lists
                        if (aExtProviders.length) {
                            this._testProviders(this.oSF.getValue());
                        }
                    }
                }.bind(this));
            }
        },

        _registerDefaultProviders: function (oSearchCEPService) {

            for (var sKey in SearchProvider.defaultProviders) {
                oSearchCEPService._registerDefaultSearchProvider(SearchProvider.defaultProviders[sKey]);
            }
        },

        _getScreenSize: function () {

            var oScreenSize = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD_EXTENDED);

            if (oScreenSize.from >= 1440) {
                return "XL";
            } else if (oScreenSize.from >= 1024) {
                return "L";
            } else if (oScreenSize.from >= 600) {
                return "M";
            } else if (oScreenSize.from >= 0) {
                return "S";
            }
        },

        _focusNextList: function (oCurrentList) {

            var aLists = this._oPopover.getContent()[1].getItems(),
                oCurrentListIndex = aLists.map(function (oList) {
                    return oList.getId();
                }).indexOf(oCurrentList.getId()),
                aNextLists = aLists.slice(oCurrentListIndex + 1);

            for (var idx = 0; idx < aNextLists.length; idx++) {
                if (aNextLists[idx].getVisible() && aNextLists[idx].getItems().length) {

                    var oControl = aNextLists[idx].getItems()[0],
                        oParent = oControl.getParent(),
                        oListConfig = oParent._getProviderConfig();

                    oControl.focus();
                    // add list name to first list item aria text for screen reader to announce relevant list name
                    this._setListNameToAriaLabelledBy(oControl, oListConfig.title);
                    break;
                }
            }
        },

        _focusPreviousList: function (oCurrentList) {

            var aLists = this._oPopover.getContent()[1].getItems(),
                oCurrentListIndex = aLists.map(function (oList) {
                    return oList.getId();
                }).indexOf(oCurrentList.getId()),
                aPreviousLists = aLists.slice(0, oCurrentListIndex);

            if (!aPreviousLists.length) {
                // focus search field if no previous lists found
                this.oSF.focus();
                return;
            }

            for (var idx = aPreviousLists.length - 1; idx >= 0; idx--) {
                if (aPreviousLists[idx].getVisible() && aPreviousLists[idx].getItems().length) {
                    var oListItems = aPreviousLists[idx].getItems(),
                        oAdditionalItems = document.getElementById(aPreviousLists[idx].getId() + "-triggerList"),
                        oAdditionalItemsStyle = window.getComputedStyle(oAdditionalItems);
                    // check if previous list has "more" button
                    if (oAdditionalItemsStyle.display === "none") {
                        // focus last item
                        oListItems[oListItems.length - 1].focus();
                    } else {
                        Core.byId(aPreviousLists[idx].getId() + "-trigger").focus();
                    }
                    break;
                }

                if (idx === 0) {
                    // focus search field if no relevant lists found
                    this.oSF.focus();
                }
            }
        },

        _keyDownHandler: function (oEvent) {

            var oControl = oEvent.srcControl,
                oParent = oControl.getParent(),
                aCurrentListItems = oParent.getItems();

            if (oEvent.code === 40 || oEvent.code === "ArrowDown") {
                // if event was triggered on the last item in the list
                if (aCurrentListItems[aCurrentListItems.length - 1] === oControl) {
                    var oAdditionalItems = document.getElementById(oParent.getId() + "-triggerList"),
                        oAdditionalItemsStyle = window.getComputedStyle(oAdditionalItems);
                    // if no additional items ("More" button), move focus to the first item of the next list
                    if (oAdditionalItemsStyle.display === "none") {
                        this._focusNextList(oParent);
                    }
                }
                // if event was triggered on "More" button, move focus to the first item of the next list
                if (oControl.getId().endsWith("-trigger")) {
                    this._focusNextList(oParent);
                }
            } else if (oEvent.code === 38 || oEvent.code === "ArrowUp") {
                if (aCurrentListItems[0] === oControl) {
                    this._focusPreviousList(oParent);
                }
            }
        },

        _setListNameToAriaLabelledBy: function (oControl, sListName) {

            var oCurrentControl = oControl.getDomRef(),
                sHiddenSpanId = jQuery(oCurrentControl).attr("aria-labelledby"),
                sText = Core.byId(sHiddenSpanId).getProperty("text");

            jQuery(Core.byId(sHiddenSpanId).getDomRef()).text(sListName + ". " + sText);
        },

        _getDefaultProviderGroupName: function (sProviderId) {

            var oListGroupMap = {
                SearchResultList: "applications",
                FrequentlyUsedAppsList: "frequentApplications",
                SearchHistoryList: "recentSearches",
                ProductsList: "homePageApplications",
                ExternalSearchAppsList: "externalSearchApplications"
            };

            return oListGroupMap[sProviderId];
        },

        _removeTopListDivider: function () {

            // remove divider above top list
            setTimeout(function () {
                var aLists = jQuery(this._oPopover.getDomRef()).find(".searchCEPList.sapUshellCEPListDivider").not(":hidden");
                if (aLists.length) {
                    jQuery.each(aLists, function (index) {
                        if (jQuery(aLists[index]).hasClass("topCEPlist")) {
                            jQuery(aLists[index]).removeClass("topCEPlist");
                        }
                    });
                    jQuery(aLists[0]).addClass("topCEPlist");
                }
            }.bind(this), 300);
        },

        _createList: function (oConfiguration, oModel) {

            var oList = new List({
                id: oConfiguration.id,
                showSeparators: "None",
                headerText: oConfiguration.titleVisible ? oConfiguration.title : "",
                headerLevel: "H1",
                growing: true,
                showNoData: oConfiguration.showNoData || false,
                growingThreshold: oConfiguration.defaultItemCount,
                growingScrollToLoad: false,
                items: {
                    path: "resultModel>/" + oConfiguration.name,
                    factory: this._createListItem.bind(this)
                },
                growingStarted: this._listUpdateStart.bind(this),
                updateStarted: this._listUpdateStart.bind(this),
                itemPress: this._itemPress.bind(this)
            }).addStyleClass("searchCEPList sapUshellCEPListDivider");

            switch (oConfiguration.id) {
                case "SearchResultList":
                    oList.attachUpdateFinished(this._resultListUpdateFinish.bind(this));
                    break;
            }

            oList.setModel(oModel, "resultModel");
            oList._providerConfig = oConfiguration;
            oList._getProviderConfig = function () {
                return this._providerConfig;
            };

            oList.addEventDelegate({
                onkeydown: this._keyDownHandler.bind(this),
                onsapdown: this._keyDownHandler.bind(this)
            });

            return oList;
        },

        _createListItem: function (sId, oContext) {

            var oParams = {
                    type: "Active",
                    title: oContext.getProperty("text"),
                    iconDensityAware: false
                },
                sIconPath = oContext.getProperty("icon");

            var oAvatar = new Avatar("", {
                displaySize: "XS",
                backgroundColor: "Transparent",
                displayShape: "Square",
                src: sIconPath,
                imageFitType: "Contain",
                decorative: true
            });

            oParams.avatar = oAvatar;

            if (sIconPath.indexOf("sap-icon://") > -1) {
                // override with generic icon color
                oAvatar.addStyleClass("searchCEPlistItemIcon");
            }

            var oListItem = new StandardListItem(oParams);
            oListItem.addStyleClass("sapUiTinyMarginBeginEnd");

            return oListItem;
        },

        _itemPress: function (oEvent) {

            var fnHandleItemPress,
                oControl = oEvent.getParameter("srcControl"),
                oParent = oControl.getParent(),
                oListConfig = oParent._getProviderConfig(),
                sGroupName = this._getDefaultProviderGroupName(oListConfig.id);

            if (sGroupName) {
                // use local handler for default provider
                sGroupName = sGroupName.charAt(0).toUpperCase() + sGroupName.substring(1);
                fnHandleItemPress = "_on" + sGroupName + "Press";
                this[fnHandleItemPress](oEvent);
            } else {
                // use configuration handler for external provider
                fnHandleItemPress = oListConfig.itemPress;
                fnHandleItemPress(oEvent);

                // handle custom press event for specific item
                var iControlIdx = oParent.getItems().indexOf(oControl),
                    aModelListItems = this._oResultModel.getProperty("/" + oListConfig.name),
                    oModelListItem = aModelListItems[iControlIdx];

                if (oModelListItem.hasOwnProperty("press") && typeof oModelListItem.press === "function") {
                    fnHandleItemPress = oModelListItem.press;
                    fnHandleItemPress(oEvent);
                }

                // handle close popover logic
                if ((!oModelListItem.hasOwnProperty("closePopover") && oListConfig.closePopover === true)
                    || (oModelListItem.hasOwnProperty("closePopover") && oModelListItem.closePopover === true)) {
                    this._oPopover.close();
                }
            }
        },

        _listUpdateStart: function (oEvent) {

            var oList = oEvent.getSource(),
                oConfiguration = oList._getProviderConfig(),
                iActualItems = oEvent.getParameter("actual"),
                sReason = oEvent.getParameter("reason"),
                iThreshold = this.bGrowingReset ? oConfiguration.maxItemCount : oConfiguration.defaultItemCount;
            /*
            * Currently UI5 List fires both deprecated and its new alternative events (growingStarted -> updateStarted).
            * updateStarted fires before growingStarted, so all of its changes are overwritten.
            * For the time being we should handle both events in the same way.
            */
            if (iActualItems && iActualItems > 0) {
                if (sReason) {
                    // updateStart
                    switch (sReason.toLowerCase()) {
                        case "growing":
                            // reset property for new threshold to take effect
                            this.bGrowingReset = true;
                            var oProperty = this._oResultModel.getProperty("/" + oConfiguration.name);
                            this._oResultModel.setProperty("/" + oConfiguration.name, []);
                            this._oResultModel.setProperty("/" + oConfiguration.name, oProperty);
                            oList.setGrowingThreshold(oConfiguration.maxItemCount);
                            break;
                        case "change":
                            oList.setGrowingThreshold(iThreshold);
                            break;
                    }
                } else {
                    // deprecated growingStart
                    oList.setGrowingThreshold(iThreshold);
                }
            }
        },

        _resultListUpdateFinish: function (oEvent) {

            var oList = oEvent.getSource(),
                oConfiguration = oList._getProviderConfig(),
                sQuery = oList.getModel("resultModel").getProperty("/query");

            if (oConfiguration.highlightResult && oConfiguration.highlightResult === true) {
                var oResults = oList.$().find(".sapMSLITitleOnly");

                jQuery.each(oResults, function (oConfiguration, index) {
                    var sRegex = new RegExp(sQuery, "gi"),
                        // remove <b> from previous highlighting
                        sCleanText = oResults[index].innerHTML.replace(/<[^>]*>/g, ""),
                        sBoldTitle = sCleanText.replace(sRegex, function (oConfiguration, sPart) {
                            return this._getBoldTitle(oConfiguration, sPart);
                        }.bind(this, oConfiguration));
                    oResults[index].innerHTML = this._getHighlightedHtml(oConfiguration, sBoldTitle);
                }.bind(this, oConfiguration));
            }
        },

        _getBoldTitle: function (oConfiguration, sPart) {

            if (oConfiguration.highlightSearchStringPart && oConfiguration.highlightSearchStringPart === true) {
                return "<b>" + sPart + "</b>";
            }
            return "</b>" + sPart + "<b>";
        },

        _getHighlightedHtml: function (oConfiguration, sBoldTitle) {

            if (!oConfiguration.highlightSearchStringPart || oConfiguration.highlightSearchStringPart !== true) {
                return "<b>" + sBoldTitle + "</b>";
            }
            return sBoldTitle;
        },

        _testProviders: function (sQuery) {

            if (!this._oResultModel) {
                this._oResultModel = new JSONModel({});
                this._oPopover.setModel(this._oResultModel, "resultModel");
            }

            var oModel = this._oResultModel,
                iQueryLength = (sQuery || "").trim().length,
                aLists = this._oPopover.getContent()[1].getItems();

            oModel.setProperty("/query", sQuery);

            if (!Device.support.touch) {
                this._sContentDensityClass = "sapUiSizeCompact";
            } else {
                this._sContentDensityClass = "sapUiSizeCozy";
            }

            for (var idx in aLists) {
                var oList = aLists[idx],
                    oProvider = oList._getProviderConfig(),
                    sGroupName = this._getDefaultProviderGroupName(oProvider.id);

                oList.setVisible(false);

                if (iQueryLength >= oProvider.minQueryLength && iQueryLength <= oProvider.maxQueryLength) {

                    oProvider.execSearch(sQuery, sGroupName).then(function (oListRef, oProviderRef, aResult) {

                        if (aResult && Array.isArray(aResult) && aResult.length > 0) {

                            // if Promise resolves with a delay and a new loop has already started - recheck priority
                            var sCurrentQuery = this._oResultModel.getProperty("/query");
                            if (sCurrentQuery && (sCurrentQuery.length < oProviderRef.minQueryLength
                                || sCurrentQuery.length > oProviderRef.maxQueryLength)) {
                                return;
                            }

                            if (!this._oPopover.isOpen()) {
                                this._toggleSearchPopover(true);
                            }

                            // trigger list update after popover is reopened (native events are not firing)
                            if (oModel.getProperty("/" + oProviderRef.name)) {
                                this.bGrowingReset = false;
                                oModel.setProperty("/" + oProviderRef.name, []);
                            }

                            oListRef.setVisible(true);

                            var aResultItems = aResult.slice(0, oProviderRef.maxItemCount);
                            oModel.setProperty("/" + oProviderRef.name, aResultItems);

                            // custom behavior for default providers
                            switch (oListRef.getId()) {
                                case "SearchResultList":
                                    this._applyResultsAcc(aResultItems.length);
                                    break;
                            }
                            this.oSF.focus();
                        }  else {
                            oModel.setProperty("/" + oProviderRef.name, []);
                            // custom behavior for default providers
                            switch (oListRef.getId()) {
                                case "SearchResultList":
                                    this._applyResultsAcc(0);
                                    var sNoResults = resources.i18n.getText("no_apps_found", [sQuery]);
                                    oListRef.setNoDataText(sNoResults);
                                    oListRef.setVisible(true);
                                    break;
                            }
                        }
                    }.bind(this, oList, oProvider));
                }
            }
            this._removeTopListDivider();
        },

        _applyResultsAcc: function (iNumOfItems) {

            var sNewAriaText = "",
                oDescriptionSpan = this.oSF.$("SuggDescr"),
                sOldAriaText = oDescriptionSpan.text();

            // add items to list
            if (iNumOfItems === 1) {
                sNewAriaText = resources.i18n.getText("one_result_search_aria", iNumOfItems);
            } else if (iNumOfItems > 1) {
                sNewAriaText = resources.i18n.getText("multiple_results_search_aria", iNumOfItems);
            } else {
                sNewAriaText = resources.i18n.getText("no_results_search_aria");
            }
            // update Accessibility text to announce current number of search results
            if (sOldAriaText.indexOf(".") < 0) {
                sNewAriaText += ".";
            }
            oDescriptionSpan.text(sNewAriaText);
        },

        _toggleSearchPopover: function (bOpen) {

            if (!this._oPopover) {
                Fragment.load({
                    name: "sap.ushell.components.shell.SearchCEP.SearchFieldFragment",
                    type: "XML",
                    controller: this
                }).then(function (popover) {

                    this._oPopover = popover;
                    var sScreenSize = this._getScreenSize(),
                        nPlaceHolderSFWidth = document.getElementById("PlaceHolderSearchField").clientWidth;

                    if (sScreenSize === "S") {
                        nPlaceHolderSFWidth = 1.1 * nPlaceHolderSFWidth;
                    } else {
                        nPlaceHolderSFWidth = 1.05 * nPlaceHolderSFWidth;
                    }

                    this._oPopover.setContentWidth(nPlaceHolderSFWidth + "px");
                    if (Configuration.getRTL() === true) {
                        var nOffsetX = this._oPopover.getOffsetX();
                        this._oPopover.setOffsetX(-1 * nOffsetX);
                    }

                    this._initializeSearchField();

                    var oText = new Text({
                            id: "popoverTitle",
                            text: "List of search results and navigation suggestions"
                        });

                        oText.addStyleClass("sapUiInvisibleText");
                        this._oPopover.addContent(oText);

                    this._initLists().then(function () {
                        this._testProviders();
                    }.bind(this));
                }.bind(this));
            } else if (bOpen) {
                this._oPopover.openBy(this._oPlaceHolderSF);
                this.bOpeningPopOver = true;

                if (this._oPlaceHolderSF.getValue() !== "") {
                    this.oSF.setValue(this._oPlaceHolderSF.getValue());
                }
            }
        },

        _initLists: function () {

            return this._SearchCEPService.then(function (oSearchCEPService) {

                var pProvidersPromise = oSearchCEPService.getSearchProvidersPriorityArray(),
                    oContent = this._oPopover.getContent()[1];

                if (!Device.support.touch) {
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    this._sContentDensityClass = "sapUiSizeCozy";
                }

                return pProvidersPromise.then(function (aProviders) {
                    for (var i = 0; i < aProviders.length; i++) {
                        var oList = this._createList(aProviders[i], this._oResultModel);
                        oList.addStyleClass(this._sContentDensityClass);
                        oContent.addItem(oList);
                    }
                }.bind(this));
            }.bind(this));
        },

        _keyDownSearchField: function (oEvent) {

            if (oEvent.code === 40 || oEvent.code === "ArrowDown") {
                this.oSF.focus();
                var aLists = this._oPopover.getContent()[1].getItems();

                for (var sListKey in aLists) {
                    if (aLists[sListKey].getVisible() && aLists[sListKey].getItems().length > 0) {

                        var oControl = aLists[sListKey].getItems()[0],
                            oParent = oControl.getParent(),
                            oListConfig = oParent._getProviderConfig();

                        oControl.focus();
                        this._setListNameToAriaLabelledBy(oControl, oListConfig.title);
                        break;
                    }
                }
            } else if (oEvent.code === 116 || oEvent.code === "F5") {
                window.location.reload();
            } else if (oEvent.code === 9 || oEvent.code === "Tab") {
                var oElement;
                if (oEvent.shiftKey) {
                    oElement = this._oPlaceHolderSF.oParent.getDomRef().firstChild.lastChild.firstChild;
                } else {
                    // sapUshellShellHeadEnd area
                    var oSapUshellShellHeadEnd = this._oPlaceHolderSF.oParent.getDomRef().lastChild,
                        aChildNodes = oSapUshellShellHeadEnd.childNodes;
                    // iterate until visible child found
                    for (var sChildKey in aChildNodes) {
                        if (getComputedStyle(aChildNodes[sChildKey]).display !== "none") {
                            oElement = aChildNodes[sChildKey];
                            break;
                        }
                    }
                }
                setTimeout(function () {
                    if (this._getScreenSize() === "S" || this._getScreenSize() === "M") {
                        Core.byId("shell-header").setSearchState("COL", 35, false);
                        Core.byId("sf").setVisible(true);
                    }
                    if (oElement) {
                        oElement.focus();
                    }
                }.bind(this), 0);
            } else if (oEvent.code === 27 || oEvent.code === "Escape") {
                this.oSF.setValue("");
                this._oPlaceHolderSF.setValue("");
                this._bEscPressed = true;
            }
        },

        _initializeSearchField: function () {

            this.oSF = Core.byId("CEPSearchField");
            var nPlaceHolderSFWidth = document.getElementById("PlaceHolderSearchField").clientWidth;

            this.oSF.setWidth(nPlaceHolderSFWidth + "px");
            this.oSF.addEventDelegate({
                onkeydown: this._keyDownSearchField.bind(this),
                onfocusin: this.onfocusin.bind(this)
            });
        },

        _saveSearchTerm: function (sTerm) {

            if (sTerm) {
                sap.ushell.Container.getServiceAsync("UserRecents")
                    .then(function (UserRecentsService) {
                        UserRecentsService.addSearchActivity({ sTerm: sTerm });
                    });
            }
        },

        _onRecentSearchesPress: function (oEvent) {

            var searchTerm = oEvent.getParameter("listItem").getProperty("title");

            this.oSF.setValue(searchTerm);
            setTimeout(function () {
                this._testProviders(searchTerm);
            }.bind(this));
        },

        _onApplicationsPress: function (oEvent) {

            var sSearchTerm = this.oSF.getValue(),
                oBindingContext = oEvent.getParameter("listItem").getBindingContext("resultModel"),
                oResult = oBindingContext.getObject();

            this._saveSearchTerm(sSearchTerm);
            this._navigateToApp(oResult);
        },

        _onHomePageApplicationsPress: function (oEvent) {

            var sSearchTerm = this.oSF.getValue(),
                oBindingContext = oEvent.getParameter("listItem").getBindingContext("resultModel"),
                oResult = oBindingContext.getObject();

            this._saveSearchTerm(sSearchTerm);
            this._navigateToApp(oResult);
        },

        _onExternalSearchApplicationsPress: function (oEvent) {

            var sSearchTerm = this.oSF.getValue(),
                oBindingContext = oEvent.getParameter("listItem").getBindingContext("resultModel"),
                oResult = oBindingContext.getObject();

            this._saveSearchTerm(sSearchTerm);
            // Navigate to ES from search within list
            if (oResult && oResult.isEnterpriseSearch === true) {
                this._navigateToResultPage(sSearchTerm, true);
            } else {
                this._navigateToApp(oResult, sSearchTerm);
            }
        },

        _onFrequentApplicationsPress: function (oEvent) {

            var oBindingContext = oEvent.getParameter("listItem").getBindingContext("resultModel"),
                oResult = oBindingContext.getObject();

            this._navigateToApp(oResult);
            if (this._oPopover.isOpen()) {
                this._oPopover.close();
            }
        },

        _navigateToApp: function (oResult, sSearchTerm) {

            this._SearchCEPService.then(function (oSearchCEPService) {
                oSearchCEPService.navigate(oResult, sSearchTerm);
            });

            if (this.oSF.getValue() !== "") {
                this.oSF.setValue("");
            }

            setTimeout(function () {
                if (this._oPopover.isOpen()) {
                    this._oPopover.close();
                }
            }.bind(this), 500);
        },

        _navigateToResultPage: function (sTerm, bAll) {

            if (sTerm === "") {
                return;
            }
            var sHash = "#WorkZoneSearchResult-display?searchTerm=" + sTerm + "&category=app";
            if (bAll === true) {
                sHash = "#Action-search&/top=20&filter={\"dataSource\":{\"type\":\"Category\",\"id\":\"All\",\"label\":\"All\",\"labelPlural\":\"All\"},\"searchTerm\":\"" +
                    sTerm + "\",\"rootCondition\":{\"type\":\"Complex\",\"operator\":\"And\",\"conditions\":[]}}";
            }

            var pNavServicePromise = sap.ushell.Container.getServiceAsync("Navigation");
            pNavServicePromise.then(function (oNavigationService) {
                oNavigationService.navigate({
                    target: {
                        shellHash: sHash
                    }
                });
            });
        }
    });
});
