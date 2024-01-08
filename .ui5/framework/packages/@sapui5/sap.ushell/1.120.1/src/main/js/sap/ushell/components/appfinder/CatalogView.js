// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/m/BusyIndicator",
    "sap/m/library",
    "sap/m/List",
    "sap/m/IllustratedMessage",
    "sap/m/Page",
    "sap/m/PageAccessibleLandmarkInfo",
    "sap/m/SplitApp",
    "sap/m/StandardListItem",
    "sap/ui/core/Core",
    "sap/ui/core/mvc/View",
    "sap/ui/core/library",
    "sap/ui/Device",
    "sap/ui/performance/Measurement",
    "sap/ushell/components/appfinder/VisualizationOrganizerHelper",
    "sap/ushell/ui/appfinder/AppBox",
    "sap/ushell/ui/appfinder/PinButton",
    "sap/ushell/ui/launchpad/AccessibilityCustomData",
    "sap/ushell/ui/launchpad/CatalogEntryContainer",
    "sap/ushell/ui/launchpad/CatalogsContainer",
    "sap/ushell/ui/launchpad/Tile",
    "sap/ushell/resources"
], function (
    BusyIndicator,
    mobileLibrary,
    List,
    IllustratedMessage,
    Page,
    PageAccessibleLandmarkInfo,
    SplitApp,
    StandardListItem,
    Core,
    View,
    coreLibrary,
    Device,
    Measurement,
    VisualizationOrganizerHelper,
    AppBox,
    PinButton,
    AccessibilityCustomData,
    CatalogEntryContainer,
    CatalogsContainer,
    Tile,
    resources
) {
    "use strict";

    // shortcut for sap.m.ListSeparators
    var ListSeparators = mobileLibrary.ListSeparators;

    // shortcut for sap.m.ListMode
    var ListMode = mobileLibrary.ListMode;

    // shortcut for sap.ui.core.AccessibleLandmarkRole
    var AccessibleLandmarkRole = coreLibrary.AccessibleLandmarkRole;

    return View.extend("sap.ushell.components.appfinder.CatalogView", {
        oController: null,
        oVisualizationOrganizerHelper: VisualizationOrganizerHelper.getInstance(),

        formatPinButtonTooltip: function (aGroupsIDs, oGroupContext) {
            var sText;

            if (oGroupContext.path) {
                var iCatalogTileInGroup = aGroupsIDs ? Array.prototype.indexOf.call(aGroupsIDs, oGroupContext.id) : -1;
                sText = iCatalogTileInGroup !== -1 ? "removeAssociatedTileFromContextGroup" : "addAssociatedTileToContextGroup";

                return resources.i18n.getText(sText, [oGroupContext.title]);
            }

            sText = aGroupsIDs && aGroupsIDs.length ? "EasyAccessMenu_PinButton_Toggled_Tooltip" : "EasyAccessMenu_PinButton_UnToggled_Tooltip";
            return resources.i18n.getText(sText);
        },

        formatPinButtonSelectState: function (aAssociatedGroups, associatedGroupsLength, sGroupContextModelPath, sGroupContextId) {
            if (sGroupContextModelPath) {
                // If in group context - the icon is determined according to whether this catalog tile exists in the group or not
                var iCatalogTileInGroup = aAssociatedGroups ? Array.prototype.indexOf.call(aAssociatedGroups, sGroupContextId) : -1;
                return iCatalogTileInGroup !== -1;
            }
            return !!associatedGroupsLength;
        },

        createContent: function (oController) {
            var that = this;

            this.oViewData = this.getViewData();
            this.parentComponent = this.oViewData.parentComponent;

            var oModel = this.parentComponent.getModel();
            this.setModel(oModel);
            this.setModel(this.oViewData.subHeaderModel, "subHeaderModel");
            this.oVisualizationOrganizerHelper.setModel(oModel);
            this.oController = oController;

            function iflong (sLong) {
                return ((sLong !== null) && (sLong === "1x2" || sLong === "2x2")) || false;
            }

            var oTilePinButton = new PinButton({
                icon: { path: "id", formatter: this.oVisualizationOrganizerHelper.formatPinButtonIcon },
                type: { path: "id", formatter: this.oVisualizationOrganizerHelper.formatPinButtonType },
                selected: {
                    parts: ["associatedGroups", "associatedGroups/length", "/groupContext/path", "/groupContext/id"],
                    formatter: this.oVisualizationOrganizerHelper.formatPinButtonSelectState.bind(this)
                },
                tooltip: {
                    parts: ["associatedGroups", "/groupContext", "id"],
                    formatter: this.oVisualizationOrganizerHelper.formatPinButtonTooltip.bind(this)
                },
                press: [this.oVisualizationOrganizerHelper.onTilePinButtonClick, this],
                visible: false
            });

            var oAppBoxPinButton = new PinButton({
                icon: { path: "id", formatter: this.oVisualizationOrganizerHelper.formatPinButtonIcon },
                type: { path: "id", formatter: this.oVisualizationOrganizerHelper.formatPinButtonType },
                selected: {
                    parts: ["associatedGroups", "associatedGroups/length", "/groupContext/path", "/groupContext/id"],
                    formatter: this.oVisualizationOrganizerHelper.formatPinButtonSelectState.bind(this)
                },
                tooltip: {
                    parts: ["associatedGroups", "/groupContext", "id"],
                    formatter: this.oVisualizationOrganizerHelper.formatPinButtonTooltip.bind(this)
                },
                press: [this.oVisualizationOrganizerHelper.onTilePinButtonClick, this],
                visible: false
            });

            this.oAppBoxesTemplate = new AppBox({
                title: "{title}",
                icon: "{icon}",
                subtitle: "{subtitle}",
                url: "{url}",
                navigationMode: "{navigationMode}",
                pinButton: oAppBoxPinButton,
                press: [oController.onAppBoxPressed, oController]
            });

            this.oVisualizationOrganizerHelper.shouldPinButtonBeVisible().then(function (bEnabled) {
                oAppBoxPinButton.setVisible(bEnabled);
                oTilePinButton.setVisible(bEnabled);
            });

            oAppBoxPinButton.addCustomData(new AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            oAppBoxPinButton.addStyleClass("sapUshellPinButton");

            oTilePinButton.addCustomData(new AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            oTilePinButton.addStyleClass("sapUshellPinButton");

            this.oTileTemplate = new Tile({
                tileViews: {
                    path: "content",
                    factory: function (sId, oContext) {
                        return oContext.getObject();
                    }
                },
                long: {
                    path: "size",
                    formatter: iflong
                },
                tileCatalogId: "{id}",
                tileCatalogIdStable: "{tileCatalogIdStable}",
                pinButton: oTilePinButton,
                press: [oController.catalogTilePress, oController],
                afterRendering: oController.onTileAfterRendering
            });

            this.oCatalogSelect = new List("catalogSelect", {
                visible: "{/enableCatalogSelection}",
                rememberSelections: true,
                showSeparators: ListSeparators.None,
                mode: ListMode.SingleSelectMaster,
                items: {
                    path: "/masterCatalogs",
                    template: new StandardListItem({
                        type: "Active",
                        title: "{title}"
                    })
                },
                showNoData: false,
                itemPress: [oController._handleCatalogListItemPress, oController],
                selectionChange: [oController._handleCatalogListItemPress, oController]
            });

            this.getCatalogSelect = function () {
                return this.oCatalogSelect;
            };

            /*
             * override original onAfterRendering as currently sap.m.Select does not support afterRendering handler in the constructor
             * this is done to support tab order accessibility
             */
            var origCatalogSelectOnAfterRendering = this.oCatalogSelect.onAfterRendering;
            if (Device.system.desktop) {
                sap.ui.require([
                    "sap/ushell/components/ComponentKeysHandler",
                    "sap/ushell/renderer/AccessKeysHandler"
                ], function (ComponentKeysHandler, AccessKeysHandler) {
                    ComponentKeysHandler.getInstance().then(function (ComponentKeysHandlerInstance) {
                        this.oCatalogSelect.addEventDelegate({
                            onsaptabnext: function (oEvent) {
                                try {
                                    oEvent.preventDefault();
                                    AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                                    ComponentKeysHandlerInstance.setFocusOnCatalogTile();
                                } catch (e) {
                                    // continue regardless of error
                                }
                            },
                            onsapskipforward: function (oEvent) {
                                try {
                                    oEvent.preventDefault();
                                    AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                                    ComponentKeysHandlerInstance.setFocusOnCatalogTile();
                                } catch (e) {
                                    // continue regardless of error
                                }
                            },
                            onsapskipback: function (oEvent) {
                                try {
                                    oEvent.preventDefault();
                                    AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                                    var openCloseSplitAppButton = Core.byId("openCloseButtonAppFinderSubheader");
                                    if (openCloseSplitAppButton.getVisible()) {
                                        openCloseSplitAppButton.focus();
                                    } else {
                                        ComponentKeysHandlerInstance.appFinderFocusMenuButtons(oEvent);
                                    }
                                } catch (e) {
                                    // continue regardless of error
                                }
                            }
                        });
                    }.bind(this));
                }.bind(this));
            }
            // if xRay is enabled
            if (oModel.getProperty("/enableHelp")) {
                this.oCatalogSelect.addStyleClass("help-id-catalogCategorySelect");// xRay help ID
            }

            this.setCategoryFilterSelection = function (sSelection, shouldFocusOnCategory) {
                var oCatalogSelection = that.getCatalogSelect();
                var aCatalogListItems = oCatalogSelection.getItems();
                var sSelected = sSelection;
                var selectedIndex = 0;

                if (!sSelected || sSelected === "") {
                    sSelected = resources.i18n.getText("all");
                }

                aCatalogListItems.forEach(function (oListItem, nIndex) {
                    if (oListItem.getTitle() === sSelected) {
                        selectedIndex = nIndex;
                        oCatalogSelection.setSelectedItem(oListItem);
                    }
                });

                if (aCatalogListItems.length !== 0 && shouldFocusOnCategory) {
                    aCatalogListItems[selectedIndex].focus();
                }
            };

            this.oCatalogSelect.onAfterRendering = function () {
                // set the selected item.
                var sSelected = that.oController.categoryFilter || resources.i18n.getText("all");

                that.setCategoryFilterSelection(sSelected);

                if (origCatalogSelectOnAfterRendering) {
                    origCatalogSelectOnAfterRendering.apply(this, arguments);
                }

                if (!this.getSelectedItem()) {
                    this.setSelectedItem(this.getItems()[0]);
                }

                // set focus on first segmented button
                setTimeout(function () {
                    var oSegmentedButton = Core.byId("appFinderSegmentedButtons");
                    if (oSegmentedButton) {
                        oSegmentedButton.focus();
                    }
                }, 0);
            };

            /*
             * setting followOf to false, so the popover won't close on IE.
             */
            var origOnAfterRenderingPopover = this.oCatalogSelect._onAfterRenderingPopover;
            this.oCatalogSelect._onAfterRenderingPopover = function () {
                if (this._oPopover) {
                    this._oPopover.setFollowOf(false);
                }
                if (origOnAfterRenderingPopover) {
                    origOnAfterRenderingPopover.apply(this, arguments);
                }
            };

            var oEventBus = Core.getEventBus();
            var sDetailPageId;
            var fnUpdateMasterDetail = function () {
                this.splitApp.toMaster("catalogSelect", "show");
                if (!Device.system.phone) {
                    sDetailPageId = this._calculateDetailPageId();
                    if (sDetailPageId !== this.splitApp.getCurrentDetailPage().getId()) {
                        this.splitApp.toDetail(sDetailPageId);
                    }
                }
            }.bind(this);

            oEventBus.subscribe("launchpad", "catalogContentLoaded", function () {
                setTimeout(fnUpdateMasterDetail, 500);
            }, this);
            oEventBus.subscribe("launchpad", "afterCatalogSegment", fnUpdateMasterDetail, this);

            var oCatalogTemplate = new CatalogEntryContainer({
                header: "{title}",
                customTilesContainer: {
                    path: "customTiles",
                    template: this.oTileTemplate,
                    templateShareable: true
                },
                appBoxesContainer: {
                    path: "appBoxes",
                    template: this.oAppBoxesTemplate,
                    templateShareable: true
                }
            });

            this.oIllustratedMessage = new IllustratedMessage({
                visible: true,
                title: resources.i18n.getText("EasyAccessMenu_NoAppsToDisplayMessagePage_Text"),
                description: " "
            }).addEventDelegate({
                onAfterRendering: function () {
                    var oIllustratedMessageDomRef = this.oIllustratedMessage.getDomRef();
                    if (oIllustratedMessageDomRef) {
                        var aIllustratedMessageMainTexts = oIllustratedMessageDomRef.getElementsByClassName("sapMTitle");
                        if (aIllustratedMessageMainTexts.length) {
                            aIllustratedMessageMainTexts[0].setAttribute("tabindex", "0");
                        }
                    }
                }.bind(this),
                onBeforeRendering: function () {
                    var oIllustratedMessageDomRef = this.oIllustratedMessage.getDomRef();
                    if (oIllustratedMessageDomRef) {
                        var aIllustratedMessageMainTexts = oIllustratedMessageDomRef.getElementsByClassName("sapMTitle");
                        if (aIllustratedMessageMainTexts.length) {
                            aIllustratedMessageMainTexts[0].removeAttribute("tabindex");
                        }
                    }
                }.bind(this)
            });

            this.oCatalogsContainer = new CatalogsContainer("catalogTiles", {
                categoryFilter: "{/categoryFilter}",
                catalogs: {
                    path: "/catalogs",
                    templateShareable: true,
                    template: oCatalogTemplate
                },
                busy: true
            }).addStyleClass("sapUiTinyMarginTop");

            this.oCatalogsContainer.addStyleClass("sapUshellCatalogTileContainer");

            this.oCatalogsContainer.addEventDelegate({
                onsaptabprevious: function (oEvent) {
                    var openCloseSplitAppButton = Core.byId("openCloseButtonAppFinderSubheader");
                    var oDomRef = oEvent.srcControl.getDomRef();
                    if (openCloseSplitAppButton.getVisible() && !openCloseSplitAppButton.getPressed() &&
                        !oDomRef.classList.contains("sapUshellPinButton")) {
                        oEvent.preventDefault();
                        var appFinderSearch = Core.byId("appFinderSearch");
                        appFinderSearch.focus();
                    }
                },
                onsapskipback: function (oEvent) {
                    var openCloseSplitAppButton = Core.byId("openCloseButtonAppFinderSubheader");
                    if (openCloseSplitAppButton.getVisible() && !openCloseSplitAppButton.getPressed()) {
                        oEvent.preventDefault();
                        openCloseSplitAppButton.focus();
                    }
                }
            });

            this.oCatalogsContainer.onAfterRendering = function () {
                var oCatalogTilesDetailedPage = Core.byId("catalogTilesDetailedPage");
                if (!this.getBusy()) {
                    oCatalogTilesDetailedPage.setBusy(false);
                    Measurement.end("FLP:AppFinderLoadingStartToEnd");
                } else {
                    oCatalogTilesDetailedPage.setBusy(true);
                }

                document.getElementById("catalogTilesDetailedPage-cont").addEventListener("scroll", function () {
                    var oPage = Core.byId("catalogTilesDetailedPage");
                    var scroll = oPage.getScrollDelegate();
                    var currentPos = scroll.getScrollTop();
                    var max = scroll.getMaxScrollTop();

                    if (max - currentPos <= 30 + 3 * that.oController.PagingManager.getTileHeight() && that.oController.bIsInProcess === false) {
                        that.oController.bIsInProcess = true;
                        that.oController.allocateNextPage();
                        setTimeout(
                            function () {
                                that.oController.bIsInProcess = false;
                            }, 0);
                    }
                });
            };

            var oCatalogDetailedPage = new Page("catalogTilesDetailedPage", {
                showHeader: false,
                showFooter: false,
                showNavButton: false,
                content: [
                    this.oCatalogsContainer.addStyleClass("sapUshellCatalogPage")
                ],
                landmarkInfo: new PageAccessibleLandmarkInfo({
                    contentLabel: resources.i18n.getText("appFinderCatalogTitle"),
                    contentRole: AccessibleLandmarkRole.None, // Named sections automatically have the region role, see MDN
                    rootRole: AccessibleLandmarkRole.None
                })
            });

            var oCatalogMessage = new Page("catalogMessagePage", {
                showHeader: false,
                showFooter: false,
                showNavButton: false,
                content: [this.oIllustratedMessage]
            });

            var oSelectBusyIndicator = new BusyIndicator("catalogSelectBusyIndicator", { size: "1rem" });
            this.splitApp = new SplitApp("catalogViewMasterDetail", {
                masterPages: [oSelectBusyIndicator, this.oCatalogSelect],
                detailPages: [oCatalogDetailedPage, oCatalogMessage],
                mode: "{= ${/isPhoneWidth} ? 'HideMode' : 'ShowHideMode'}"
            });

            return this.splitApp;
        },

        // calculate what is the relevant current detail page according to configuration and state of the view
        _calculateDetailPageId: function () {
            var oSubHeaderModel = this.getModel("subHeaderModel");
            var bSearchMode = oSubHeaderModel.getProperty("/search/searchMode");
            var bTagMode = oSubHeaderModel.getProperty("/tag/tagMode");
            var bNoCatalogs = !!this.getModel().getProperty("/catalogsNoDataText");
            var sId;
            if (bSearchMode || bTagMode) {
                sId = this.getController().bSearchResults ? "catalogTilesDetailedPage" : "catalogMessagePage";
            } else if (bNoCatalogs) {
                sId = "catalogMessagePage";
            } else {
                sId = "catalogTilesDetailedPage";
            }
            return sId;
        },

        getControllerName: function () {
            return "sap.ushell.components.appfinder.Catalog";
        }
    });
});
