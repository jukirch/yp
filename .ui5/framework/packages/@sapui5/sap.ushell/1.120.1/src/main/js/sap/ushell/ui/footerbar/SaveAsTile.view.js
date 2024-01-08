// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/m/FlexBox",
    "sap/m/GenericTile",
    "sap/m/ImageContent",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/library",
    "sap/m/NumericContent",
    "sap/m/Select",
    "sap/m/TileContent",
    "sap/ui/core/HTML",
    "sap/ui/core/ListItem",
    "sap/ui/core/mvc/View",
    "sap/ui/model/BindingMode",
    "sap/ui/thirdparty/jquery",
    "sap/ushell/resources",
    "sap/ushell/ui/launchpad/Tile",
    "sap/ushell/ui/footerbar/SaveAsTile.controller" // controller must be loaded
], function (
    FlexBox,
    GenericTile,
    ImageContent,
    Input,
    Label,
    mobileLibrary,
    NumericContent,
    Select,
    TileContent,
    HTML,
    ListItem,
    View,
    BindingMode,
    jQuery,
    resources,
    Tile
    // SaveAsTileController
) {
    "use strict";

    // shortcut for sap.m.FlexJustifyContent
    var FlexJustifyContent = mobileLibrary.FlexJustifyContent;

    // shortcut for sap.m.FlexRendertype
    var FlexRendertype = mobileLibrary.FlexRendertype;

    // shortcut for sap.m.FlexAlignItems
    var FlexAlignItems = mobileLibrary.FlexAlignItems;

    return View.extend("sap.ushell.ui.footerbar.SaveAsTile", {
        getControllerName: function () {
            return "sap.ushell.ui.footerbar.SaveAsTile";
        },

        createContent: function () {
            this.oResourceBundle = resources.i18n;
            this.viewData = this.getViewData() || {};
            this.appData = this.viewData.appData || {};
            this.oTitleInput = new Input("bookmarkTitleInput", {
                placeholder: this.oResourceBundle.getText("bookmarkDialogoTitle_tooltip"),
                value: {
                    path: "/title",
                    mode: BindingMode.TwoWay
                }
            }).addStyleClass("sapUshellInputField");
            this.oSubTitleInput = new Input("bookmarkSubTitleInput", {
                placeholder: this.oResourceBundle.getText("bookmarkDialogoSubTitle_tooltip"),
                value: {
                    path: "/subtitle",
                    mode: BindingMode.TwoWay
                }
            }).addStyleClass("sapUshellInputField");
            this.oInfoInput = new Input("bookmarkInfoInput", {
                placeholder: this.oResourceBundle.getText("bookmarkDialogoDescription_tooltip"),
                value: {
                    path: "/info",
                    mode: BindingMode.TwoWay
                },
                visible: "{/showInfo}"
            }).addStyleClass("sapUshellInputField");

            var oTile;
            // If the viewData contains 'serviceUrl', it means we need to instantiate GenericTile as 'dynamic'.
            if (this.viewData.serviceUrl) {
                oTile = new GenericTile({
                    header: "{/title}",
                    subheader: "{/subtitle}",
                    tileContent: [new TileContent({
                        footer: "{/info}",
                        unit: "{/numberUnit}",
                        // We'll utilize NumericContent for the "Dynamic" content.
                        content: [new NumericContent({
                            value: "{/numberValue}",
                            truncateValueTo: 5, // Otherwise, The default value is 4.
                            icon: "{/icon}",
                            withMargin: false,
                            width: "100%"
                        })]
                    })]
                });

            } else {
                oTile = new GenericTile({
                    header: "{/title}",
                    subheader: "{/subtitle}",
                    tileContent: [new TileContent({
                        footer: "{/info}",
                        content: new ImageContent({
                            src: "{/icon}"
                        })
                    })]
                });
            }
            this.setTileView(oTile);

            var tileWrapper = new Tile({
                long: false,
                tileViews: [oTile],
                noContainerMode: true
            });

            var oPreviewBackgroundElement = new HTML("previewBackgroundElement", {
                content: "<div class='sapUshellShellBG sapContrastPlus sapUiStrongBackgroundColor'></div>"
            });

            var hbox = new FlexBox("saveAsTileHBox", {
                items: [oPreviewBackgroundElement, tileWrapper],
                alignItems: FlexAlignItems.Center,
                justifyContent: FlexJustifyContent.Center,
                renderType: FlexRendertype.Bare,
                visible: "{/showPreview}"
            }).addStyleClass("sapUshellShellBG").addStyleClass("sapUshellBookmarkFormPreviewBoxBottomMargin");

            this.oGroupsSelect = new Select("groupsSelect", {
                items: {
                    path: "/groups",
                    template: new ListItem({ text: "{title}" })
                },
                width: "100%",
                visible: {
                    parts: ["/showGroupSelection", "/groups"],
                    formatter: function (bShowGroupSelection, aGroups) {
                        if (bShowGroupSelection && !(aGroups && aGroups.length)) {
                            this.oController.loadPersonalizedGroups();
                        }
                        return bShowGroupSelection;
                    }.bind(this)
                }
            });

            var oPreview = new Label("previewLbl", {
                text: this.oResourceBundle.getText("previewFld"),
                labelFor: hbox,
                visible: "{/showPreview}"
            });

            var oTitle = new Label("titleLbl", {
                required: true,
                text: " " + this.oResourceBundle.getText("titleFld"),
                labelFor: this.oTitleInput
            });

            var oSubTitle = new Label("subtitleLbl", {
                text: this.oResourceBundle.getText("subtitleFld"),
                labelFor: this.oSubTitleInput
            });

            var oInfo = new Label("infoLbl", {
                text: this.oResourceBundle.getText("tileSettingsDialog_informationField"),
                labelFor: this.oInfoInput,
                visible: "{/showInfo}"
            });

            var sTargetsLabelText = this.oResourceBundle.getText("GroupListItem_label");
            var oTargetsLabel = new Label("groupLbl", {
                text: sTargetsLabelText,
                labelFor: this.oGroupsSelect,
                visible: "{/showGroupSelection}"
            });

            return [
                oPreview,
                hbox,
                oTitle,
                this.oTitleInput,
                oSubTitle,
                this.oSubTitleInput,
                oInfo,
                this.oInfoInput,
                oTargetsLabel,
                this.oGroupsSelect
            ];
        },

        getTitleInput: function () {
            return this.oTitleInput;
        },

        getTileView: function () {
            return this.tileView;
        },

        setTileView: function (oTileView) {
            this.tileView = oTileView;
        }
    });
});
