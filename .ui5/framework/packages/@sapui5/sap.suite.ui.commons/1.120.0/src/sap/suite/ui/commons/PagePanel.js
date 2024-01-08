sap.ui.define([
    "sap/suite/ui/commons/BasePanel",
    "sap/m/FlexBox",
    "sap/suite/ui/commons/Page",
    "sap/m/GenericTile",
    "sap/suite/ui/commons/util/PageIconsConstant",
    "sap/m/IllustratedMessage",
    "sap/m/Button",
    "sap/ushell/Config",
    "sap/ui/core/theming/Parameters",
    "sap/ui/Device",
    "sap/suite/ui/commons/MenuButton"
], function (
    BasePanel,
    FlexBox,
    Page,
    GenericTile,
    PagesIcons,
    IllustratedMessage,
    Button,
    Config,
    Parameters,
    Device,
    MenuButton
) {
    "use strict";

    var PagePanel = BasePanel.extend("sap.suite.ui.commons.PagePanel", {
        metadata : {
            properties : {
                title: { type: "string", group: "Misc", visibility: "hidden" },
                key: { type: "string", group: "Misc", visibility: "hidden"},
                width: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" },
                height: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" }
            }
        }
    });

    var PAGE_SELECTION_LIMIT = 8;
    var MYHOME_SPACE_ID = "SAP_BASIS_SP_UI_MYHOME";
    var FALLBACK_ICON = "sap-icon://document";
    var maxTileSize = 15;
    var minTileSize = 7;

    var fnFetchLegendColor = function (sLegendName) {
        return {
            key: sLegendName,
            value: Parameters.get({
                name: sLegendName
            }),
            assigned: false
        };
    };


    var defaultBgColor = function () {
        return fnFetchLegendColor("sapLegendColor9");
    },
    legendColors = function () {
        return [
            "sapLegendColor6",
            "sapLegendColor3",
            "sapLegendColor1",
            "sapLegendColor10",
            "sapLegendColor12",
            "sapLegendColor7",
            "sapLegendColor5",
            "sapLegendColor8",
            "sapLegendColor18",
            "sapLegendColor9"
        ].map(fnFetchLegendColor);
    };


    var ScreenSizes = {
        phone: 240,
        tablet: 600,
        desktop: 1024,
        xxsmall: 240,
        xsmall: 320,
        small: 480,
        medium: 560,
        large: 768,
        xlarge: 960,
        xxlarge: 1120,
        xxxlarge: 1440
      },

       DEVICE_TYPES = {
            Desktop: "Desktop",
            Tablet: "Tablet",
            Mobile: "Mobile"
        };

      var getDeviceType = function() {
          var sDeviceType;
          if (Device.resize.width >= ScreenSizes.xsmall && Device.resize.width < ScreenSizes.tablet) {
              //Screen between 320 - 600
              sDeviceType = DEVICE_TYPES.Mobile;
          } else if (Device.resize.width >= ScreenSizes.tablet && Device.resize.width < ScreenSizes.desktop) {
              //Screen between 600 - 1024
              sDeviceType = DEVICE_TYPES.Tablet;
          } else {
              //Screen greater than 1024
              sDeviceType = DEVICE_TYPES.Desktop;
          }
          return sDeviceType;
        };

    PagePanel.prototype.init = function() {

        this._oWrapperFlexBox = new FlexBox(this.getId() + "--flexContainerCardsContent",{
            justifyContent:"Start",
            height:"100%",
            direction:"Row",
            renderType: "Bare",
            wrap: "Wrap"
        }).addStyleClass("sapMNewsFlex newsSlideFlexGap");

        this.addContent(this._oWrapperFlexBox);
        this.setTitle(this.getResourceBundle().getText("pageTitle"));

        this.addAggregation("menuButtons", new MenuButton(`${this.getId()}-menuButton`, {
            icon: "sap-icon://slim-arrow-down"
        }));

        this._mngBtn = new Button(`${this.getId()}-mngPageBtn`, {
            text: this.getResourceBundle().getText("mngPage")
        });
        this.addAggregation("actionButtons", this._mngBtn);
        this._oColorList = legendColors().slice(0, PAGE_SELECTION_LIMIT);
        BasePanel.prototype.init.apply(this, arguments);
	};

    PagePanel.prototype._getColorMap = function () {
        return this._oColorList;
    };

    PagePanel.prototype.getFreeColor  = function () {
        var oColor = this._oColorList.find(function (oColour) { return !oColour.assigned; }),
            sColor = defaultBgColor().key;

        if (oColor) {
            oColor.assigned = true;
            sColor = oColor.key;
        }
        return sColor;
    };

    PagePanel.prototype.addColor = function (sKey) {
        this._fetchColor(sKey).assigned = true;
        return this;
    };

    PagePanel.prototype.removeColor = function (sKey) {
        this._fetchColor(sKey).assigned = false;
        return this;
    };

    PagePanel.prototype._fetchColor = function (sKey) {
        return this._oColorList.find(function (oColour) { return oColour.key === sKey; }) || {};
    };
    PagePanel.prototype.getData = function () {
        if (!this.oPagePromise) {
            this.oPagePromise = this._getPages().then(function(){
                this._getInnerControls();
            }.bind(this));
        }
        return this.oPagePromise;
    };

    PagePanel.prototype.attachResizeHandler = function (bIsNewsTileVisible, containerWidth) {
        try {
            var sDeviceType = getDeviceType(),
            iFavPagesCount = this.aFavPages.length;

            var domRef = this.getContent()[0].getDomRef();
            if (!domRef) {
                return false;
            }
            var domRefClientWidth ;
            if (containerWidth) {
                if (bIsNewsTileVisible) {
                    domRefClientWidth =  domRef.clientWidth;
                } else {
                    domRefClientWidth =  containerWidth;
                }
            }

            this.pageTilesStylesApplied = true;

            var pagesPerRow,
                tileWidth,
                wrapperWidth = (domRefClientWidth) / 16,   // Divide by 16 to convert to rem,
                gap = 1,
                hBoxWidth,
                flexWrapperWidth = containerWidth ? containerWidth :  domRef.clientWidth;

            if (bIsNewsTileVisible &&  flexWrapperWidth >= 1520){  // As newsTile will grow till 40.75 rem, calculating the remaining width
                wrapperWidth = (flexWrapperWidth / 16) - 40.75;
            }

            // If Space available display all tiles in a single row
            if (!bIsNewsTileVisible){
                var spaceRequired = (iFavPagesCount * minTileSize) + ((iFavPagesCount - 1) * gap);
                if (spaceRequired <= wrapperWidth){
                    pagesPerRow = iFavPagesCount;
                    tileWidth = (wrapperWidth - ((pagesPerRow - 1) * gap)) / pagesPerRow;
                    tileWidth = tileWidth <= maxTileSize ? tileWidth : maxTileSize;
                    this.setPropertyValues({hBoxWidth: wrapperWidth + "rem", pagesTileWidth : tileWidth + "rem"});
                    return true;
                }
            }

            if (sDeviceType === DEVICE_TYPES.Desktop) {
                if (bIsNewsTileVisible){
                    pagesPerRow = Math.ceil(iFavPagesCount >= 8 ? 4 : iFavPagesCount / 2);
                } else {
                    pagesPerRow = iFavPagesCount <= 4 ? iFavPagesCount : Math.ceil(iFavPagesCount >= 8 ? 4 : iFavPagesCount / 2);
                }
            }

            tileWidth = (wrapperWidth - ((pagesPerRow - 1) * gap)) / pagesPerRow;
            tileWidth = tileWidth <= maxTileSize ? tileWidth : maxTileSize;

            hBoxWidth = (pagesPerRow * tileWidth) + (pagesPerRow * gap);
            this.setPropertyValues({hBoxWidth: hBoxWidth + "rem", pagesTileWidth : tileWidth + "rem"});

            return true;
        } catch (oErr) {
            return false;
        }
    };

    PagePanel.prototype._getInnerControls = function () {
        this.myFavPage = [];
        this.oInnerControls = [];
        if (this.aFavPages) {
            this.aFavPages.forEach(function(oPage) {
                this.myFavPage.push(new Page({
                    title: oPage.title,
                    subTitle: oPage.title === oPage.spaceTitle ? null :  oPage.spaceTitle,
                    icon: oPage.icon,
                    bgColor: oPage.BGColor,
                    pageId: oPage.pageId,
                    spaceId: oPage.spaceId,
                    spaceTitle: oPage.spaceTitle,
                    url: "#Launchpad-openFLPPage?pageId=" + oPage.pageId + "&spaceId=" + oPage.spaceId
                }));
            }.bind(this));
            this.myFavPage.forEach(function(oFav){
                this.oInnerControls.push(new GenericTile( {
                    // width: "10rem",
                    header: oFav.getTitle(),
                    subheader: oFav.getSubTitle(),
                    press: oFav.onPageTilePress.bind(this, oFav),
                    sizeBehavior:"Responsive",
                    state: "Loaded",
                    frameType: "OneByOne",
                    mode: "IconMode",
                    backgroundColor: oFav.getBgColor(),
                    tileIcon: oFav.getIcon(),
                    visible: true,
                    renderOnThemeChange: true,
                    ariaRole: "listitem",
                    dropAreaOffset: 8,
                    url: oFav.getProperty("url")
                }));
            }.bind(this));

            this._oWrapperFlexBox.setAlignItems(this.aFavPages.length == 1 ? "Start" : "Center");

            if (this.aFavPages.length) {
                this.getParent()?._panelLoadedFn("Page", {loaded: true, count: this.aFavPages.length});
                this.setFavPagesContent();
            } else {
                this.getParent()?._panelLoadedFn("Page", {loaded: true, count: 0});
                this.setNoPageContent();
            }
        } else {
            this.getParent()?._panelLoadedFn("Page", {loaded: false, count: 0});
            this.removeAggregation("content", this._oWrapperFlexBox);
        }

    };

    PagePanel.prototype.setFavPagesContent = function () {
        this._oWrapperFlexBox.removeAllItems();
        this.oInnerControls.forEach(function(oTile){
            this._oWrapperFlexBox.addItem(oTile);
        }.bind(this));
    };

    PagePanel.prototype._createNoPageContent = function () {
        if (!this._oIllusMsg) {
            this._oIllusMsg = new IllustratedMessage(this.getId() + "--idNoPages",{
                illustrationSize:"Spot",
                illustrationType:"sapIllus-SimpleNoSavedItems",
                title: this.getResourceBundle().getText("noDataPageTitle"),
                description:this.getResourceBundle().getText("noPageDescription")
            }).addStyleClass("myHomeIllustratedMsg myHomeIllustratedMessageAlign");
            this.oAddPageBtn = new Button(this.getId() + "--idAddPageBtn",{
                text: this.getResourceBundle().getText("addPage"),
                tooltip: this.getResourceBundle().getText("addPage"),
                type: "Emphasized"
            });
        }
    };

    PagePanel.prototype.setNoPageContent = function () {
        this._createNoPageContent();
        this._oIllusMsg.addAdditionalContent(this.oAddPageBtn);
        this._oWrapperFlexBox.removeAllItems();
        this._oWrapperFlexBox.addStyleClass("pagesFlexBox");
        this._oWrapperFlexBox.addItem(this._oIllusMsg);
    };

    PagePanel.prototype._setDefaultPages = function (aAvailablePages) {

        this.aFavPages = aAvailablePages.slice(0, PAGE_SELECTION_LIMIT) || [];
        this._setFavPages(this.aFavPages);
        return this.aFavPages;
    };

    PagePanel.prototype.setPropertyValues = function (oVal) {
       var propNames = Object.keys(oVal);
       propNames.forEach(function(sProperty){
            if (sProperty === "hBoxWidth") {
                this._oWrapperFlexBox.setProperty("width", oVal[sProperty]);
            } else if (sProperty === "pagesTileWidth" && this.oInnerControls.length) {
                this.oInnerControls.forEach(function(oTile){
                    oTile.setProperty("width", oVal[sProperty]);
                });
            }
       }.bind(this));
    };

    PagePanel.prototype._setFavPages = function (aFavPages, bUpdatePersonalisation) {
        var bArePagesEmpty;
        aFavPages.forEach(function (oPage) {
            oPage.selected = true;
            if (!oPage.BGColor) {
                oPage.BGColor = this.getFreeColor();
            } else {
                this.addColor(oPage.BGColor);
            }
        }.bind(this));

        //Display pages container if there are pages
        bArePagesEmpty = !aFavPages.length;
        if (!bArePagesEmpty) {
            //Fetch and apply Icons for Favorite Pages
            this._applyIconsForFavPages();
        }
    };

    PagePanel.prototype._applyIconsForFavPages = function() {
            this.aFavPages.map(function(oPage) {
                return this._getIconForPage(oPage);
            }.bind(this));
    };

    PagePanel.prototype._getIconForPage = function (oFavPage) {
        //Check for icon in page icon constants file
        var oIcon = PagesIcons.PAGES.find(function (oPage) {
                return oFavPage.pageId.includes(oPage.id);
            });

        if (!oIcon) {
            //Check for icon in space icon constants file
            oIcon = PagesIcons.SPACES.find(function (oSpace) {
                return oFavPage.spaceId.includes(oSpace.id);
            });
        }

        oFavPage.icon = oIcon ? oIcon.icon : FALLBACK_ICON;
        oFavPage.isIconLoaded = true;
    };

    PagePanel.prototype._getPages = function () {
        var aFavoritePages = this.aFavPages ? this.aFavPages : undefined;
        var bForceUpdate = false;
        var bSpaceEnabled = encodeURIComponent(Config.last("/core/spaces/enabled"));
        if (bSpaceEnabled && sap.ushell && sap.ushell.Container) {
            return this._fetchAllAvailablePages(true).then(function(aAvailablePages) {
                //Set first 8 available pages are favorite if no favorite page data is present
                if (!aFavoritePages) {
                    if (aAvailablePages.length) {
                        this._setDefaultPages(aAvailablePages);
                    } else {
                        this.removeAggregation("content", this._oWrapperFlexBox);
                       return Promise.resolve( this.getParent()?._panelLoadedFn("Page", {loaded: false, count: 0}));
                    }

                } else {
                    var aPages = [], oExistingPage;
                    aFavoritePages.forEach(function(oPage) {
                        oExistingPage = aAvailablePages.find(function(oAvailablePage) {
                            return oAvailablePage.pageId === oPage.pageId;
                        });
                        if (oExistingPage) {
                            oExistingPage.BGColor = oPage.BGColor;
                            aPages.push(oExistingPage);
                        }
                    });
                    //To send Maximum of 8 Pages (BCP incident: 2270169293)
                    aPages = aPages.slice(0, PAGE_SELECTION_LIMIT);
                    if (aPages.length || !aFavoritePages.length) {
                       this._setFavPages(aPages, aPages.length !== aFavoritePages.length || bForceUpdate);
                    } else if (!aPages.length && aFavoritePages.length) {
                       this._setDefaultPages(aAvailablePages);
                    }
                }

                //Update available pages list
                this.availablePages = aAvailablePages;
            }.bind(this));
        } else {
            //if no ushell
            return Promise.resolve([]);
        }
    };

    PagePanel.prototype._fetchAllAvailableSpaces = function () {
        if (this._aSpaces) {
            return Promise.resolve(this._aSpaces);
        } else if (sap.ushell.Container.getServiceAsync) {
            return sap.ushell.Container.getServiceAsync("Bookmark")
            .then(function (bookMarkService) {
                return bookMarkService.getContentNodes?.() || Promise.resolve([]);
            })
            .then(function (oSpaces) {
                //Filter MyHome Space from Spaces
                this._aSpaces = oSpaces.filter(function(oSpace) {
                    return oSpace.id !== MYHOME_SPACE_ID;
                });

                //Add Initial Default Color for Spaces
                this._aSpaces.forEach(function(oSpace) {
                    oSpace.BGColor = defaultBgColor();
                    oSpace.applyColorToAllPages = false;
                });

                return this._aSpaces;
            }.bind(this));
        } else {
            return Promise.resolve([]);
        }
    };

    PagePanel.prototype._fetchAllAvailablePages = function (bFetchDistinctPages) {
        return this._aPages
            ? Promise.resolve(this._aPages)
            : this._fetchAllAvailableSpaces()
                .then(function (aSpaces) {
                    this._aPages = [];
                    aSpaces.forEach(function (oSpace) {
                        if (Array.isArray(oSpace.children)) {
                            oSpace.children.forEach(function (oPage) {
                                if (!bFetchDistinctPages || (bFetchDistinctPages && !this._aPages.find(function (oExistingPage) { return oExistingPage.id === oPage.id; }))) {
                                    this._aPages.push({
                                        title: oPage.label,
                                        icon: FALLBACK_ICON,
                                        isIconLoaded: false,
                                        pageId: oPage.id,
                                        spaceId: oSpace.id,
                                        spaceTitle: oSpace.label,
                                        url: "#Launchpad-openFLPPage?pageId=" + oPage.id + "&spaceId=" + oSpace.id
                                    });
                                }
                            }.bind(this));
                        }
                    }.bind(this));
                    return this._aPages;
                }.bind(this));
    };

    return PagePanel;
});
