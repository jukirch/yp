/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/library",
    "sap/m/MenuItem",
    "sap/ui/core/Core",
    "sap/ui/core/Fragment",
    "sap/ui/core/CustomData",
    "sap/base/util/ObjectPath",
    "sap/ui/thirdparty/hasher",
    "sap/ushell/ui/footerbar/AddBookmarkButton",
    "sap/suite/ui/commons/collaboration/ServiceContainer",
    "sap/ui/performance/trace/FESRHelper"
], function (
    BaseObject,
    SapMLibrary,
    MenuItem,
    Core,
    Fragment,
    CustomData,
    ObjectPath,
    hasher,
    AddBookmarkButton,
    SuiteCollaborationServiceContainer,
    FESRHelper
) {
    "use strict";
    return BaseObject.extend("sap.ovp.app.ShareUtils", {
        /**
         * constructor of the class
         * @memberOf sap.ovp.app.ShareUtils
         * @param {sap.ui.core.mvc.Controller} controller
         */
        constructor: function (controller) {
            if (!controller) {
                throw new Error("controller is undefined!");
            }
            this.oController = controller;
        },

        /**
         * Function for one time initialization once view is loaded
         * @memberOf sap.ovp.app.ShareUtils
         */
        init: function () {
            // Set model for tile
            this._createModelForTile();
            // check jam authorization
            this._checkJamAuth();
        },

        /**
         * Function to display a popover providing the following options on clicking of Share Menu button in Page header
         *  1. Send as Email (Share the whole page)
         *  2. Create Tile on FLP
         *  3. Share to Microsoft Teams
         * @memberOf sap.ovp.app.ShareUtils
        */

        onShareButtonAvailableAndPressed: function (oButton) {
            var oLibraryResourceBundle = this.oController._getLibraryResourceBundle();
            var oUIModel = this.oController.getUIModel();
            var sTitle = oUIModel && oUIModel.getProperty("/title");
            var that = this;
            var oBookmarkButton;
            var oShareFragmentController = {
                shareEmailPressed: function () {
                    //Trigger email when 'Send Email' is clicked
                    SapMLibrary.URLHelper.triggerEmail(null, oLibraryResourceBundle.getText("Email_Subject", [sTitle]), document.URL);
                },
                /**
                 * Press handler for the Collaboration Helper Option.
                 * This method create Payload that need to pass for invoking Collaboration
                 * Option.
                 */
                shareMSTeamsPressed: function () {
                    var sAppTitle = "";
                    var sSubtitle = oUIModel.getProperty("/subtitle");
                    if (sSubtitle && sSubtitle.length > 0) {
                        sAppTitle = oUIModel.getProperty("/appTitle") || "";
                        sSubtitle = sTitle + ' - ' + sSubtitle;
                    } else {
                        sSubtitle = "";
                        sAppTitle = sTitle;
                    }
                    var data = {
                        url: document.URL,
                        appTitle: sAppTitle,
                        subTitle: sSubtitle,
                        minifyUrlForChat: true
                    };
                    that.oSuiteCollaborationService.share(this.getCustomData()[0].getValue(), data);
                },
                shareJamPressed: function () {
                    var oShareDialog = Core.createComponent({
                        name: "sap.collaboration.components.fiori.sharing.dialog",
                        settings: {
                            object: {
                                id: document.URL,
                                share: sTitle
                            }
                        }
                    });
                    oShareDialog.open();
                },
                shareTilePressed: function () {
                    oBookmarkButton.firePress();
                }
            };

            // load fresh fragment every time
            if (this.oShareActionSheet) {
                this.oShareActionSheet.destroy();
            }

            this.oSharePageFragment = Fragment.load({
                name: "sap.ovp.app.SharePage",
                controller: oShareFragmentController
            }).then(
                function (oControl) {
                    that.oController.getView().addDependent(oControl);
                    return oControl;
                }
            );

            this.oSharePageFragment.then(function (oControl) {
                that.oShareActionSheet = oControl;
                oBookmarkButton = new AddBookmarkButton("", {
                    customUrl: oUIModel.getProperty("/tileInfo").tileCustomURL(),
                    title: sTitle,
                    tileIcon: oUIModel.getProperty("/icon") || "sap-icon://bookmark"
                });
                oUIModel.setProperty("/tileVisible", oBookmarkButton.getEnabled());
                oUIModel.setProperty("/tileIcon", oBookmarkButton.getIcon());
                oUIModel.setProperty("/tileText", oBookmarkButton.getText());

                var iIndexForCollaborationOptions = 2;
                if (!oUIModel.getProperty("/jamVisible")) {
                    iIndexForCollaborationOptions = 1;
                }
                /** By default below configurations are true. Hence no need to pass anything to oSuiteCollaborationService.getOptions method
                 *  {
                        isShareAsLinkEnabled: true,
                        isShareAsTabEnabled: true
                    }
                    Pass this object with properties set to false to oSuiteCollaborationService.getOptions method in order to hide it.
                 */
                SuiteCollaborationServiceContainer.getServiceAsync().then(function (oSuiteCollaborationService) {
                    that.oSuiteCollaborationService = oSuiteCollaborationService;
                    var aCollaborationOptions = that.oSuiteCollaborationService.getOptions();
                    if (Array.isArray(aCollaborationOptions) && aCollaborationOptions.length > 0) {
                        aCollaborationOptions.forEach(function (oMainMenuItem) {
                            if (Array.isArray(oMainMenuItem.subOptions) && oMainMenuItem.subOptions.length > 1) {
                                var aMenus = [];
                                oMainMenuItem.subOptions.forEach(function (menuItem) {
                                    var oItem = new MenuItem({
                                        text: menuItem.text,
                                        icon: menuItem.icon,
                                        press: oShareFragmentController.shareMSTeamsPressed
                                    });
                                    oItem.addCustomData(new CustomData({
                                        key: "data",
                                        value: menuItem
                                    }));
                                    FESRHelper.setSemanticStepname(oItem, "press", menuItem.fesrStepName);
                                    aMenus.push(oItem);
                                });
                                that.oShareActionSheet.insertItem(new MenuItem({
                                    text: oMainMenuItem.text,
                                    icon: oMainMenuItem.icon,
                                    items: aMenus
                                }), iIndexForCollaborationOptions);
                            } else {
                                var oItem = new MenuItem({
                                    text: oMainMenuItem.text,
                                    icon: oMainMenuItem.icon,
                                    press: oShareFragmentController.shareMSTeamsPressed
                                });
                                oItem.addCustomData(new CustomData({
                                    key: "data",
                                    value: oMainMenuItem
                                }));
                                FESRHelper.setSemanticStepname(oItem, "press", oMainMenuItem.fesrStepName);
                                that.oShareActionSheet.insertItem(oItem, iIndexForCollaborationOptions);
                            }
                            iIndexForCollaborationOptions++;
                        });
                    }
                    that.oShareActionSheet.openBy(oButton);
                });
            });
        },

        /**
         * This function checks if the current user has JAM group authorizations and the share to jam button will be displayed accordingly
         * @memberOf sap.ovp.app.ShareUtils
         */
        _checkJamAuth: function () {
            var fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
            var oUIModel = this.oController.getUIModel();
            if (oUIModel) {
                oUIModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());
            }
        },

        /**
         * Function to set tile information
         * @memberOf sap.ovp.app.ShareUtils
         */
        _createModelForTile: function () {
            var oUIModel = this.oController.getUIModel();
            var sHash,
                sTitle = oUIModel && oUIModel.getProperty("/title");
            var oTileInfo = {
                tileTitle: sTitle, //Set the title of the tile
                tileCustomURL: function () {
                    //Set the URL that the tile should point to
                    sHash = hasher.getHash();
                    return sHash ? "#" + sHash : window.location.href;
                }
            };
            if (oUIModel) {
                //Bind the information of the tile to the model
                oUIModel.setProperty("/tileInfo", oTileInfo);
            }
        }
    });
});