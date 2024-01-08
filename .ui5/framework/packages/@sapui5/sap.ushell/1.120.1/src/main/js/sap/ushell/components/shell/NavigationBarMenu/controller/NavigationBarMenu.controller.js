// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Controller for the NavigationBarMenu Popover. It is responsible for Popover handling, model binding, persistence
 * logic to pin, unpin and rearrange pinned spaces as well as executing navigation.
 *
 * @version 1.120.1
 * @private
 */
sap.ui.define([
    "sap/ui/core/InvisibleMessage",
    "sap/ui/core/library",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter",
    "sap/ushell/resources",
    "sap/ushell/utils/WindowUtils"
], function (
    InvisibleMessage,
    coreLibrary,
    Controller,
    Fragment,
    Filter,
    FilterOperator,
    Sorter,
    resources,
    WindowUtils
) {
    "use strict";

    // shortcut for sap.ui.core.dnd.RelativeDropPosition
    var RelativeDropPosition = coreLibrary.dnd.RelativeDropPosition;

    // shortcut for sap.ui.core.InvisibleMessageMode
    var InvisibleMessageMode = coreLibrary.InvisibleMessageMode;

    /**
     * Controller of the NavigationBarMenu view.
     * It is responsible for the popover handling, pinning / unpinning spaces, rearranging spaces via DnD and do persistence of these changes.
     *
     * @param {string} sId Controller id
     * @param {object} oParams Controller parameter
     *
     * @class
     * @extends sap.ui.core.mvc.Controller
     *
     * @private
     * @since 1.114.0
     * @alias sap.ushell.components.shell.NavigationBarMenu.controller.NavigationBarMenu
     */
    return Controller.extend("sap.ushell.components.shell.NavigationBarMenu.controller.NavigationBarMenu", {
        /**
         * Initializes the controller. ResourceBundle and Menu service promise are set.
         *
         * @private
         * @since 1.114.0
         */
        onInit: function () {
            this.pMenuServicePromise = sap.ushell.Container.getServiceAsync("Menu");
            this._oInvisibleMessageInstance = InvisibleMessage.getInstance();
        },

        /**
         * UI5 lifecycle method which is called upon controller destruction.
         *
         * @private
         * @since 1.117.0
         */
        onExit: function () {
            if (this._oInvisibleMessageInstance) {
                this._oInvisibleMessageInstance.destroy();
            }
        },

        /**
         * Updates the the title of the pinned spaces tree to show the current number of spaces pinned.
         * @param {sap.ui.base.Event} oEvent Update Event from the Pinned Spaces Tree
         *
         * @since 1.114.0
         * @private
         */
        _onPinnedSpacesUpdateFinished: function (oEvent) {
            var sPinnedSpacesTreeTitleText = resources.i18n.getText("NavigationBarMenu.PinnedSpaces.Title", [oEvent.getParameter("total") || 0]);
            this.byId("PinnedSpacesTreeTitle").setText(sPinnedSpacesTreeTitleText);
        },

        /**
         * Opens the Navigation Bar Menu Popover. Sets the menu model from the menu bar to the popover.
         * @param {sap.ui.base.Event} oEvent Press Event of the Button to open the Popover.
         *
         * @since 1.114.0
         * @private
         */
        openNavigationBarMenuPopover: function (oEvent) {
            var oNavigationBarMenuButton = oEvent.getSource();
            if (!this._pPopoverPromise) {
                this._pPopoverPromise = Fragment.load({
                    type: "XML",
                    id: this.getView().getId(),
                    controller: this,
                    name: "sap.ushell.components.shell.NavigationBarMenu.view.NavigationBarMenuPopover"
                }).then(function (oNavigationBarMenuPopover) {
                    this.oModel = this.getOwnerComponent().oPropagatedProperties.oModels.menu;
                    oNavigationBarMenuPopover.setModel(this.oModel, "spaces");
                    this.getView().addDependent(oNavigationBarMenuPopover);
                    return oNavigationBarMenuPopover;
                }.bind(this));
            }

            this._pPopoverPromise.then(function (oNavigationBarMenuPopover) {
                this._bindPinnedSpaces().then(function () {
                    oNavigationBarMenuPopover.openBy(oNavigationBarMenuButton);
                });
            }.bind(this));
        },

        /**
         * Closes the navigation bar menu popover.
         *
         * @since 1.114.0
         * @private
         */
        closeNavigationBarMenuPopover: function () {
            this._pPopoverPromise.then(function (oPopover) {
                oPopover.close();
            });
        },

        /**
         * Handles the click Event of the Pin Button. If the Space is pinned it will be unpinned and vice versa.
         * @param {sap.ui.base.Event} oEvent Click event of the list item pin button
         *
         * @since 1.114.0
         * @private
         */
        handlePinButtonPress: function (oEvent) {
            var oPinButton = oEvent.getSource();
            var sSpacePath = oPinButton.getBindingContext("spaces").getPath();
            var isPinned = this.oModel.getProperty(sSpacePath + "/pinned");
            if (!isPinned) {
                this._pinSpace(sSpacePath);
            } else {
                this._unpinSpace(sSpacePath, true);
            }

            // Focus the pinned spaces list again after the list item that had the focus is removed.
            if (oPinButton.getId().includes("PinnedSpaces")) {
                // First move the focus away from the list. Otherwise the pin button of the
                // next item is focused instead of the item itself.
                var oNavigationBarMenuPopover = this.byId("NavigationBarMenuPopover");
                oNavigationBarMenuPopover.focus();
                var oPinnedSpacesList = this.byId("PinnedSpaces");
                var oDelegate = {
                    onAfterRendering: function () {
                        // This needs to be done in onAfterRendering as the Popover gets closed
                        // if setting the focus is triggered too early.
                        oPinnedSpacesList.focus();
                        oPinnedSpacesList.removeEventDelegate(oDelegate);
                    }
                };
                oPinnedSpacesList.addEventDelegate(oDelegate);
            }
        },

        /**
         * Unpins all pinned Spaces.
         *
         * @since 1.114.0
         * @private
         */
        unpinAllSpaces: function () {
            var oPinnedSpaces = this.byId("PinnedSpaces");
            var aNavBarItems = oPinnedSpaces.getModel("spaces").getData();
            aNavBarItems = aNavBarItems.map(function (oNavBarItem) {
                oNavBarItem.pinnedSortOrder = parseInt(oNavBarItem.pinnedSortOrder, 10);
                return oNavBarItem;
            });
            var aSpacesToUnpin = aNavBarItems.sort(function (oItemA, oItemB) {
                if (oItemA.pinnedSortOrder < oItemB.pinnedSortOrder) {
                    return -1;
                }

                if (oItemA.pinnedSortOrder > oItemB.pinnedSortOrder) {
                    return 1;
                }

                return 0;
            });
            var oSpaceToUnpin;
            var bRemovableSpace = false;
            for (var i = 0; i < aSpacesToUnpin.length; ++i) {
                oSpaceToUnpin = aSpacesToUnpin[i];

                if (bRemovableSpace) {
                    oSpaceToUnpin.pinned = false;
                    oSpaceToUnpin.pinnedSortOrder = "-1";
                } else {
                    oSpaceToUnpin.pinnedSortOrder = "" + oSpaceToUnpin.pinnedSortOrder;
                    if (oSpaceToUnpin.type === "separator") {
                        bRemovableSpace = true;
                    }
                }
            }
            this._savePinnedSpaces();
        },

        /**
         * Rearranges the pinned spaces by using the Menu service.
         *
         * @param {sap.ui.base.Event} oEvent Drop Event to rearrange the pinned spaces
         *
         * @since 1.115.0
         * @private
         */
        rearrangePinnedSpaces: function (oEvent) {
            var oDraggedSpaceContext = oEvent.getParameter("draggedControl").getBindingContext("spaces");
            var iSourcePinnedSortOrder = this.oModel.getProperty(oDraggedSpaceContext.getPath()).pinnedSortOrder;
            var oDroppedSpace = oEvent.getParameter("droppedControl");
            var oDroppedSpaceContext = oDroppedSpace.getBindingContext("spaces");
            var iDroppedPinnedSortOrder = this.oModel.getProperty(oDroppedSpaceContext.getPath()).pinnedSortOrder;
            var sDropPosition = oEvent.getParameter("dropPosition");
            var iTargetPinnedSortOrder = iDroppedPinnedSortOrder + (sDropPosition === RelativeDropPosition.After ? 1 : 0);

            this._rearrangePinnedSpaces(iSourcePinnedSortOrder, iTargetPinnedSortOrder, oDroppedSpace, sDropPosition);
        },


        /**
         * Rearranges the pinned spaces by using the Menu service.
         *
         * @param {int} sourceIndex Initial index of the control to be rearranged.
         * @param {int} targetIndex Target index for the control to be rearranged.
         *
         * @since 1.117.0
         * @private
         */
        _rearrangePinnedSpaces: function (sourceIndex, targetIndex, droppedItem, dropPosition) {
            this.pMenuServicePromise.then(function (oMenu) {
                oMenu.moveMenuEntry(sourceIndex, targetIndex);

                // manage focus after move happened
                var oPinnedSpacesTree = this.byId("PinnedSpaces");
                var oDelegate = {
                    onAfterRendering: function () {
                        var aPinnedSpaces = oPinnedSpacesTree.getItems();
                        var iDroppedItemPosition = oPinnedSpacesTree.indexOfItem(droppedItem);
                        var focusIndex;
                        if (sourceIndex < targetIndex) {
                            focusIndex = iDroppedItemPosition - (dropPosition === RelativeDropPosition.Before ? 1 : 0);
                        } else {
                            focusIndex = iDroppedItemPosition + (dropPosition === RelativeDropPosition.After ? 1 : 0);
                        }
                        var oPinnedSpaceToFocus = aPinnedSpaces[focusIndex];
                        if (oPinnedSpaceToFocus) {
                            oPinnedSpaceToFocus.focus();
                        }
                        droppedItem.removeEventDelegate(oDelegate);
                    }
                };
                droppedItem.addEventDelegate(oDelegate);

                // announces the move
                var sPinnedSpaceMovedMessage = resources.i18n.getText("NavigationBarMenu.PinnedSpaces.Moved");
                this._oInvisibleMessageInstance.announce(sPinnedSpaceMovedMessage, InvisibleMessageMode.Polite);

                this._savePinnedSpaces();
            }.bind(this));
        },

        /**
         * Binds the pinned spaces to the Tree for pinned spaces.
         *
         * @returns {Promise}
         *  A promise which is resolved after the binding is performed
         *
         * @since 1.114.0
         * @private
         */
        _bindPinnedSpaces: function () {
            var oPinnedSpaces = this.byId("PinnedSpaces");

            if (!this._pCustomTreeItemPromise) {
                this._pCustomTreeItemPromise = Fragment.load({
                    type: "XML",
                    async: true,
                    controller: this,
                    name: "sap.ushell.components.shell.NavigationBarMenu.view.CustomTreeItem"
                }).then(function (oCustomTreeItem) {
                    oCustomTreeItem.addEventDelegate({
                        onsapdownmodifiers: this._handleSpacesSwap.bind(this),
                        onsapupmodifiers: this._handleSpacesSwap.bind(this)
                    });
                    oPinnedSpaces.bindItems({
                        path: "spaces>/",
                        filters: [
                            new Filter({ path: "pinned", operator: FilterOperator.EQ, value1: true }),
                            new Filter({ path: "type", operator: FilterOperator.NE, value1: "separator" }),
                            new Filter({ path: "isHomeEntry", operator: FilterOperator.EQ, value1: false })],
                        sorter: [new Sorter({ path: "pinnedSortOrder", descending: false })],
                        parameters: {
                            arrayNames: ["menuEntries"]
                        },
                        template: oCustomTreeItem,
                        templateShareable: false
                    });
                }.bind(this));
            }

            return this._pCustomTreeItemPromise;
        },

        /**
         * Handles keydown events to rearranges the pinned spaces.
         *
         * @param {sap.ui.base.Event} oEvent Keydown Event to rearrange the pinned spaces
         *
         * @since 1.117.0
         * @private
         */
        _handleSpacesSwap: function (oEvent) {
            var oPinnedSpacesTree = this.byId("PinnedSpaces");
            var aPinnedSpaces = oPinnedSpacesTree.getItems();
            var oPinnedSpace;

            for (var i = 0; i < aPinnedSpaces.length; i++) {
                oPinnedSpace = aPinnedSpaces[i];

                if (document.activeElement === oPinnedSpace.getFocusDomRef()) {
                    var oSourceContext = oPinnedSpace.getBindingContext("spaces");
                    var iSourcePinnedSortOrder = this.oModel.getProperty(oSourceContext.getPath()).pinnedSortOrder;
                    var oTargetContext;
                    var iTargetPinnedSortOrder;

                    if (oEvent.type === "sapupmodifiers") {
                        var oPreviousPinnedSpace = aPinnedSpaces[i - 1];
                        if (oPreviousPinnedSpace) {
                            oTargetContext = oPreviousPinnedSpace.getBindingContext("spaces");
                            iTargetPinnedSortOrder = this.oModel.getProperty(oTargetContext.getPath()).pinnedSortOrder;
                            this._rearrangePinnedSpaces(iSourcePinnedSortOrder, iTargetPinnedSortOrder, oPreviousPinnedSpace, RelativeDropPosition.Before);
                            oEvent.preventDefault();
                            oEvent.stopPropagation();
                        }
                    } else if (oEvent.type === "sapdownmodifiers") {
                        var oNextPinnedSpace = aPinnedSpaces[i + 1];
                        if (oNextPinnedSpace) {
                            oTargetContext = oNextPinnedSpace.getBindingContext("spaces");
                            iTargetPinnedSortOrder = this.oModel.getProperty(oTargetContext.getPath()).pinnedSortOrder;
                            this._rearrangePinnedSpaces(iSourcePinnedSortOrder, iTargetPinnedSortOrder + 1, oNextPinnedSpace, RelativeDropPosition.After);
                            oEvent.preventDefault();
                            oEvent.stopPropagation();
                        }
                    }
                    return;
                }
            }
        },

        /**
         * Creates a CustomTreeItem that only shows its expander and is navigateable if the space has more than one pages.
         * @param {string} sId The id of the instantiating source.
         * @param {object} oContext of the instantiating source.
         * @returns {sap.m.CustomTreeItem} A CustomTreeItem that only shows the expander and is navigateable if more than one pages exist inside of the given space,
         *
         * @since 1.114.0
         * @private
         */
        allSpacesFactory: function (sId, oContext) {
            var oMenuEntry = oContext.getModel().getProperty(oContext.getPath());
            var aSubMenuEntries = oMenuEntry.menuEntries || [];

            var oSpaceItem = this.byId("AllSpaces").getDependents()[0].clone(sId);
            oSpaceItem.setType("Active");
            oSpaceItem.attachPress(this.onMenuItemSelection, this);
            // If the space has only one page, this means no sub menu:
            // Hide expander & enable navigation
            if (aSubMenuEntries.length < 1) {
                oSpaceItem.addStyleClass("sapMTreeItemBaseLeaf");
            }

            if (oMenuEntry.type === "separator" || oMenuEntry.isHomeEntry) {
                oSpaceItem.setVisible(false);
            }

            return oSpaceItem;
        },

        /**
         * Unpins a single Space.
         * @param {string} sSpacePath Path of the space in the model
         * @param {boolean} bSaveUnpinning Shall the unpinning of a given space be saved to the personalization?
         *
         * @since 1.114.0
         * @private
         */
        _unpinSpace: function (sSpacePath, bSaveUnpinning) {
            this.oModel.setProperty(sSpacePath + "/pinned", false);
            this.oModel.setProperty(sSpacePath + "/pinnedSortOrder", "-1");
            if (bSaveUnpinning) {
                this._savePinnedSpaces();
            }
        },

        /**
         * Pins a single Space. The pinnedSortOrder is set by taking the pinnedSortOrder of the last tree item and raising it by 1.
         * @param {string} sSpacePath Path of the space in the model
         *
         * @since 1.114.0
         * @private
         */
        _pinSpace: function (sSpacePath) {
            var iNumberOfPinnedSpaces = this.byId("PinnedSpaces").getItems().length;
            // Since the MyHome and separator are part of the model (pinnedSortOrder 0 and 1), the 1st new pinned space starts with 2.
            var iNewPinnedSortOrder = 2;
            if (iNumberOfPinnedSpaces > 0) {
                var oLastPinnedSpace = this.byId("PinnedSpaces").getItems()[iNumberOfPinnedSpaces - 1];
                var sLastPinnedSpacePath = oLastPinnedSpace.getBindingContextPath("spaces");
                iNewPinnedSortOrder = this.oModel.getProperty(sLastPinnedSpacePath + "/pinnedSortOrder") + 1;
            }
            this.oModel.setProperty(sSpacePath + "/pinnedSortOrder", iNewPinnedSortOrder);
            this.oModel.setProperty(sSpacePath + "/pinned", true);
            this._savePinnedSpaces();
        },

        /**
         * Performs a navigation to the provided intent using the Navigation service.
         *
         * @param {object} oDestinationTarget
         *  The destination target which is used for the navigation
         *
         * @returns {Promise}
         *  A promise which is resolved after the CrossAppNavigation is performed
         *
         * @private
         * @since 1.114.0
         */
        _performNavigation: function (oDestinationTarget) {
            return sap.ushell.Container.getServiceAsync("Navigation")
                .then(function (oNavigationService) {
                    var oParams = {};
                    oDestinationTarget.parameters.forEach(function (oParameter) {
                        if (oParameter.name && oParameter.value) {
                            oParams[oParameter.name] = [oParameter.value];
                        }
                    });

                    return oNavigationService.navigate({
                        target: {
                            semanticObject: oDestinationTarget.semanticObject,
                            action: oDestinationTarget.action
                        },
                        params: oParams
                    });
                });
        },

        /**
          * Opens the provided URL in a new browser tab.
          *
          * @param {object} oDestinationTarget
          *  The destination target which is used to determine the URL which should be
          *  opened in a new browser tab
          *
          * @private
          * @since 1.114.0
          */
        _openURL: function (oDestinationTarget) {
            WindowUtils.openURL(oDestinationTarget.url, "_blank");
        },

        /**
         * Determines the selected menu entry with the required navigation action
         * according to the navigation type.
         *
         * @param {sap.ui.base.Event} oEvent The event containing the selected menu intent
         *
         * @private
         * @since 1.114.0
         */
        onMenuItemSelection: function (oEvent) {

            // Access menu entry
            var oListItem = oEvent.getSource();
            var oItemContextPath = oListItem.getBindingContextPath("spaces");
            var oListItemModelEntry = this.oModel.getProperty(oItemContextPath);
            var bAmIAllSpacesItem = oEvent.getParameter("id").includes("AllSpaces");
            if (!bAmIAllSpacesItem) {
                return;
            }
            if (oListItem.isLeaf()) {
                // Intent based navigation
                if (oListItemModelEntry.type === "IBN") {
                    this._performNavigation(oListItemModelEntry.target)
                        .then(this.closeNavigationBarMenuPopover.bind(this));
                }

                // URL
                if (oListItemModelEntry.type === "URL") {
                    this._openURL(oListItemModelEntry.target);
                    this.closeNavigationBarMenuPopover();
                }
                return;
            }
        },

        /**
         * Saves the pinning, unpinning and rearranging changes to the personalization by using the Menu Service.
         *
         * @since 1.114.0
         * @private
         */
        _savePinnedSpaces: function () {
            this.pMenuServicePromise.then(function (oMenu) {
                this.oModel.refresh(true);
                return oMenu.savePersonalization();
            }.bind(this));
        }
    });
});
