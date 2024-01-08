// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/library",
    "sap/ui/core/mvc/Controller",
    "sap/ushell/Config",
    "sap/ushell/utils/WindowUtils",
    "sap/ui/model/json/JSONModel",
    "sap/m/library",
    "sap/base/Log",
    "sap/ushell/utils/UrlParsing",
    "sap/ushell/EventHub"
], function (
    ushellLibrary,
    Controller,
    Config,
    WindowUtils,
    JSONModel,
    mobileLibrary,
    Log,
    UrlParsing,
    EventHub
) {
    "use strict";

    // shortcut for sap.m.GenericTileScope
    var GenericTileScope = mobileLibrary.GenericTileScope;

    // shortcut for sap.m.GenericTileMode
    var GenericTileMode = mobileLibrary.GenericTileMode;

    // shortcut for sap.ushell.DisplayFormat
    var DisplayFormat = ushellLibrary.DisplayFormat;

    // shortcut for sap.ushell.AppType
    var AppType = ushellLibrary.AppType;

    /* global hasher */

    return Controller.extend("sap.ushell.components.tiles.cdm.applauncher.StaticTile", {
        _aDoables: [],

        _getConfiguration: function () {
            var oConfig = this.getView().getViewData();
            oConfig.properties.configSizeBehavior = Config.last("/core/home/sizeBehavior");
            oConfig.properties.wrappingType = Config.last("/core/home/wrappingType");
            return oConfig;
        },

        _setShowContentProviderInfoOnVisualizations: function (bShowContentProviderInfoOnVisualizations, sContentProviderId, oModel) {
            if (!bShowContentProviderInfoOnVisualizations) {
                oModel.setProperty("/properties/showContentProviderInfoOnVisualizations", false);
                return Promise.resolve();
            }
            return sap.ushell.Container.getServiceAsync("ClientSideTargetResolution")
                .then(function (oCSTR) {
                    return oCSTR.getSystemContext(sContentProviderId);
                })
                .then(function (oSystemContext) {
                    oModel.setProperty("/properties/contentProviderLabel", oSystemContext.label);
                    oModel.setProperty("/properties/showContentProviderInfoOnVisualizations", true);
                })
                .catch(function (oError) {
                    Log.error("StaticTile.controller threw an error:", oError);
                });
        },

        onInit: function () {
            var oView = this.getView();
            var oModel = new JSONModel();
            oModel.setData(this._getConfiguration());

            // set model, add content
            oView.setModel(oModel);
            // listen for changes of the size behavior, as the end user can change it in the settings (if enabled)
            this._aDoables.push(Config.on("/core/home/sizeBehavior").do(function (sSizeBehavior) {
                oModel.setProperty("/properties/configSizeBehavior", sSizeBehavior);
            }));

            var oViewData = this.getView().getViewData();
            var oViewDataProperties = oViewData.properties;
            var sContentProviderId = oViewData.properties.contentProviderId;

            oViewDataProperties.mode = oViewDataProperties.mode || (oViewDataProperties.icon ? "ContentMode" : "HeaderMode");

            if (oViewDataProperties.displayFormat === DisplayFormat.Compact &&
                oViewDataProperties.title && oViewDataProperties.targetURL) {
                oModel.setProperty("/properties/mode", GenericTileMode.LineMode);
            }

            switch (oViewDataProperties.displayFormat) {
                case DisplayFormat.Flat:
                    oModel.setProperty("/properties/frameType", "OneByHalf");
                    break;
                case DisplayFormat.FlatWide:
                    oModel.setProperty("/properties/frameType", "TwoByHalf");
                    break;
                case DisplayFormat.StandardWide:
                    oModel.setProperty("/properties/frameType", "TwoByOne");
                    break;
                default: {
                    oModel.setProperty("/properties/frameType", "OneByOne");
                }
            }

            this._setShowContentProviderInfoOnVisualizations(
                Config.last("/core/contentProviders/providerInfo/showContentProviderInfoOnVisualizations"),
                sContentProviderId,
                oModel
            );
            // listen for changes of the "showContentProviderInfoOnVisualizations" config,
            // as the end user can change it in the settings (if enabled)
            this._aDoables.push(Config.on("/core/contentProviders/providerInfo/showContentProviderInfoOnVisualizations")
                .do(function (bShowContentProviderInfoOnVisualizations) {
                    this._setShowContentProviderInfoOnVisualizations(bShowContentProviderInfoOnVisualizations, sContentProviderId, oModel);
                }.bind(this)));
        },

        onExit: function () {
            this._aDoables.forEach(function (oDoable) {
                oDoable.off();
            });
            this._aDoables = [];
        },

        /**
         * Sets the scope property to the model according to the value of "editable".
         *
         * @param {boolean} editable Indicating if edit mode should be active.
         */
        editModeHandler: function (editable) {
            var sScope = editable ? GenericTileScope.ActionMore : GenericTileScope.Display;
            this.getView().getModel().setProperty("/properties/scope", sScope);
        },

        /**
         * Sets the sizeBehavior to the model.
         *
         * @param {sap.m.TileSizeBehavior} sSizeBehavior The sizeBehavior.
         * @since 1.116.0
         */
        sizeBehaviorHandler: function (sSizeBehavior) {
            this.getView().getModel().setProperty("/properties/customSizeBehavior", sSizeBehavior);
        },

        // trigger to show the configuration UI if the tile is pressed in Admin mode
        onPress: function (oEvent) {
            var oTileConfig = this.getView().getViewData().properties;

            if (oEvent.getSource().getScope && oEvent.getSource().getScope() === GenericTileScope.Display) {
                var sTargetURL = this._createTargetUrl();
                if (!sTargetURL) {
                    return;
                }
                EventHub.emit("UITracer.trace", {
                    reason: "LaunchApp",
                    source: "Tile",
                    data: {
                        targetUrl: sTargetURL
                    }
                });
                if (sTargetURL[0] === "#") {
                    hasher.setHash(sTargetURL);
                } else {
                    // add the URL to recent activity log
                    var bLogRecentActivity = Config.last("/core/shell/enableRecentActivity") && Config.last("/core/shell/enableRecentActivityLogging");
                    if (bLogRecentActivity) {
                        var oRecentEntry = {
                            title: oTileConfig.title,
                            appType: AppType.URL,
                            url: oTileConfig.targetURL,
                            appId: oTileConfig.targetURL
                        };
                        sap.ushell.Container.getRenderer("fiori2").logRecentActivity(oRecentEntry);
                    }
                    WindowUtils.openURL(sTargetURL, "_blank");
                }
            }
        },

        updatePropertiesHandler: function (oNewProperties) {
            var oTile = this.getView().getContent()[0];
            var oTileContent = oTile.getTileContent()[0];

            if (typeof oNewProperties.title !== "undefined") {
                oTile.setHeader(oNewProperties.title);
            }
            if (typeof oNewProperties.subtitle !== "undefined") {
                oTile.setSubheader(oNewProperties.subtitle);
            }
            if (typeof oNewProperties.icon !== "undefined") {
                oTileContent.getContent().setSrc(oNewProperties.icon);
            }
            if (typeof oNewProperties.info !== "undefined") {
                oTileContent.setFooter(oNewProperties.info);
            }
        },

        _createTargetUrl: function () {
            var sTargetURL = this.getView().getViewData().properties.targetURL;
            var sSystem = this.getView().getViewData().configuration["sap-system"];
            var oHash;

            if (sTargetURL && sSystem) {
                // when the navigation url is hash we want to make sure system parameter is in the parameters part
                if (UrlParsing.isIntentUrl(sTargetURL)) {
                    oHash = UrlParsing.parseShellHash(sTargetURL);
                    if (!oHash.params) {
                        oHash.params = {};
                    }
                    oHash.params["sap-system"] = sSystem;
                    sTargetURL = "#" + UrlParsing.constructShellHash(oHash);
                } else {
                    sTargetURL += ((sTargetURL.indexOf("?") < 0) ? "?" : "&") + "sap-system=" + sSystem;
                }
            }
            return sTargetURL;
        },

        // Return lean url for the <a> tag of the Generic Tile
        _getLeanUrl: function () {
            return WindowUtils.getLeanURL(this._createTargetUrl());
        },

        _getTileContent: function (sId, oBindingContext) {
            var aParts = oBindingContext.getPath().split("/");
            aParts.pop();
            var oBindingObject = oBindingContext.getProperty(aParts.join("/"));
            if (oBindingObject !== this.oLastBindingObject || this.oTileContent && this.oTileContent.bIsDestroyed) {
                this.oLastBindingObject = oBindingObject;
                this.oTileContent = this.getView().byId(oBindingObject.icon ? "imageTileContent" : "standardTileContent").clone();
            }
            return this.oTileContent;
        },

        _getCurrentProperties: function () {
            var oTile = this.getView().getContent()[0];
            var oTileContent = oTile.getTileContent()[0];
            var sizeBehavior = Config.last("/core/home/sizeBehavior");

            return {
                title: oTile.getHeader(),
                subtitle: oTile.getSubheader(),
                info: oTileContent.getFooter(),
                icon: oTileContent.getContent().getSrc(),
                mode: oTile.getMode(),
                configSizeBehavior: sizeBehavior
            };
        }
    });
}, /* bExport= */ true);
