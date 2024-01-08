sap.ui.define([
    "sap/suite/ui/commons/BasePanel",
    "sap/ui/model/xml/XMLModel",
    "sap/m/SlideTile",
    "sap/m/GenericTile",
    "sap/m/TileContent",
    "sap/m/NewsContent",
    "sap/m/library",
    "sap/ui/core/format/DateFormat",
    "sap/m/FlexItemData",
    "sap/suite/ui/commons/MenuButton",
    "sap/m/Button"
], function (
    BasePanel,
    XMLModel,
    SlideTile,
    GenericTile,
    TileContent,
    NewsContent,
    mobileLibrary,
    DateFormat,
    FlexItemData,
    MenuButton,
    Button

) {
    "use strict";

    var NewsPanel = BasePanel.extend("sap.suite.ui.commons.NewsPanel", {
        metadata : {
            properties : {
                url: { type: "string", group: "Misc", defaultValue: '' },
                title: { type: "string", group: "Misc", visibility: "hidden" },
                key: { type: "string", group: "Misc", visibility: "hidden"},
                width: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" },
                height: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%", visibility: "hidden" }
            }
        }
    });



    var URLHelper = mobileLibrary.URLHelper;
    var DEFAULT_FEED_COUNT = 7;
    var oRelativeDateFormatter = DateFormat.getDateTimeInstance({
        style: "medium",
        relative: true,
        relativeStyle:"short"
    });


    NewsPanel.prototype.init = function () {
        this._oNewsTile = new SlideTile(this.getId() + "--idNewsSlide",{
            displayTime: 20000,
            width: "100%",
            height: "17rem"
        }).addStyleClass("newsTileMaxWidth");

        this.addContent( this._oNewsTile );
        this.setTitle(this.getResourceBundle().getText("newsTitle"));

        this.addAggregation("menuButtons", new MenuButton(`${this.getId()}-menuButton`, {
            icon: "sap-icon://slim-arrow-down"
        }));

        this._mngNewsBtn = new Button(`${this.getId()}-mngNewsBtn`, {
            text: this.getResourceBundle().getText("mngNews")
        });
        this.addAggregation("actionButtons", this._mngNewsBtn);
        BasePanel.prototype.init.apply(this, arguments);

    };

    NewsPanel.prototype.getData = function () {
        this.newsContainer = this.getParent();

        if (!this.oNewsPromise) {
            this.oNewsPromise = new Promise(function(resolve, reject){
                //Intialize models
                this._oNewsModel = new XMLModel();

                this._oNewsModel.setDefaultBindingMode("OneWay");
                this._oNewsTile.setModel(this._oNewsModel);
                this.newsLoad =    this.newsLoad || false;
                this._oNewsModel.attachRequestCompleted(function(oEvent) {
                    if (!this.newsLoad) {
                        this._onNewsModelLoaded(oEvent);
                        if (oEvent.getParameters().success) {
                            this.newsContainer?._panelLoadedFn("News", {loaded: true});
                            this.newsLoad = true;
                        }
                        this.setNewsPanel();
                        resolve();
                    }

                }.bind(this));

                this._oNewsModel.attachRequestFailed(function() {
                    if (!this.newsLoad) {
                        this.newsContainer?._panelLoadedFn("News", {loaded: false});
                        this.removeAggregation("content", this.getNewsTile());
                        this.newsLoad = true;
                        reject();
                    }
                }.bind(this));
                this.setNewsUrl();
             }.bind(this));
        }
        return this.oNewsPromise;
    };

    NewsPanel.prototype.setNewsPanel = function (bVisible) {

            //get better way to access innercontrol
            this.oFlexItem =  this.oFlexItem || new FlexItemData(this.getId() + "--idNewsItemDatanew",{
                growFactor: 1,
                maxWidth: "39.75rem"
            });
            this.newsContainer?.getInnerControl().addStyleClass("newsSlideFlexGap");
            this._oNewsTile.getParent()?.addStyleClass("newsTileMaxWidth");
            this._oNewsTile.getParent()?.setLayoutData( this.oFlexItem);

    };
    NewsPanel.prototype.setNewsUrl = function () {

        this._sUrl = this.getUrl();
        if (this.getNewsTile()) {
            if (this._sUrl ) {
                this._loadFeedFromURL(this._sUrl );
            } else {
                this.handleFeedError();
            }
        } else {
            this.handleFeedError();
        }
    };

    NewsPanel.prototype._onNewsModelLoaded = function (oEvent) {
        var oDocument = oEvent.getSource().getData();
        this.loadNewsFeed(oDocument);
    };

    NewsPanel.prototype._loadFeedFromURL = function (sNewsUrl) {
        if (sNewsUrl) {
            this._oNewsModel.loadData(sNewsUrl);
        }
    };

    NewsPanel.prototype.loadNewsFeed = function(oDocument, noOfFeeds){
        var oBindingInfo;
        if (oDocument && oDocument.querySelector && !!oDocument.querySelector("rss") && !!oDocument.querySelector("item")) {
            oBindingInfo = {
                path: "/channel/item",
                length: noOfFeeds || DEFAULT_FEED_COUNT,
                template: {
                    imageUrlParts: ["link/@href", "link"],
                    link: "{= ${link/@href} || ${link}}",
                    footerParts: ["published", "pubDate"],
                    contentText: "{title}",
                    subheader: "{= ${summary} || ${description}}",
                    pressHandler: this._navigateToNewscontent,
                    footerFormatter: this._formatDate.bind(this)
                }
            };
            this.bindNewsTile(this._oNewsTile, oBindingInfo);
        } else if (oDocument && oDocument.querySelector && !!oDocument.querySelector("feed") && !!oDocument.querySelector("entry")) {
            oBindingInfo = {
                path: "/entry",
                length: noOfFeeds || DEFAULT_FEED_COUNT,
                template: {
                    imageUrlParts: ["link/@href", "link"],
                    link: "{= ${link/@href} || ${link}}",
                    footerParts: ["published", "updated"],
                    contentText: "{title}",
                    subheader: "{= ${summary} || ${description}}",
                    pressHandler: this._navigateToNewscontent,
                    footerFormatter: this._formatDate.bind(this)
                }
            };
            this.bindNewsTile(this._oNewsTile, oBindingInfo);
        } else {
            this.handleFeedError();
        }
    };

    NewsPanel.prototype.getNewsTile = function () {
        return this._oNewsTile;
    };
    NewsPanel.prototype.handleFeedError = function () {

        this.getNewsTile().removeAllTiles();
        this.getNewsTile().setVisible(false);
        this.newsContainer?._panelLoadedFn("News", {loaded: false});
        this.newsLoad = true;
    };



    NewsPanel.prototype.bindNewsTile = function (oSlideTile, oBindingInfo) {
        if (oBindingInfo) {

            this.getNewsTile().setVisible(true);
            oSlideTile.bindAggregation("tiles", {
                path: oBindingInfo.path,
                length: oBindingInfo.length,
                templateShareable: false,
                template: this.generateTemplate(oBindingInfo.template)
            });
        }
    };

    NewsPanel.prototype.generateTemplate = function (oTemplateInfo) {
        var oGenericTile = new GenericTile({
            backgroundImage: {
                parts: oTemplateInfo.imageUrlParts,
                formatter:  oTemplateInfo.imageFormatter || this.extractImage.bind(this)
            },
            mode: "ArticleMode",
            press: [oTemplateInfo.pressHandler, this],
            frameType: "Stretch",
            url: oTemplateInfo.link,
            tileContent: [
                new TileContent({
                    footer: {
                        parts: oTemplateInfo.footerParts,
                        formatter: oTemplateInfo.footerFormatter
                    },
                    content: [
                        new NewsContent({
                            contentText: oTemplateInfo.contentText,
                            subheader: oTemplateInfo.subheader
                        })
                    ]
                })
            ]
        });
        return oGenericTile;
    };

    NewsPanel.prototype._navigateToNewscontent = function (oEvent) {
        var url = oEvent.getSource().getUrl();
        URLHelper.redirect(url, true);
    };

    NewsPanel.prototype._formatDate = function (oPublished, oUpdated) {
        var sDateString = oPublished ? oPublished : oUpdated;
        return this._toRelativeDateTime(new Date(sDateString));
    };

    NewsPanel.prototype.extractImage = function (sHrefLink, sLink) {
        var fnLoadPlaceholderImage = function() {
            var sPrefix = sap.ui.require.toUrl("suite/suite-ui-commons/src/sap/suite/ui/commons/util/");
            //ensure default images
            this.image = this.image ? this.image + 1 : 1;
            this.image = this.image < 9 ? this.image : 1;
            return sPrefix + "/imgNews/" + this.image + ".jpg";
        }.bind(this);

        return fetch(sHrefLink || sLink)
            .then(function(res) {
                return res.text();
            })
            .then(function(sHTML) {
                //Check for og:image meta tag used for link-preview image
                var aMatches = sHTML.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
                if (Array.isArray(aMatches) && aMatches[1]) {
                    return aMatches[1];
                } else {
                    return fnLoadPlaceholderImage();
                }
            })
            .catch(function() {
                return fnLoadPlaceholderImage();
            });
    };

    NewsPanel.prototype._toRelativeDateTime = function (oDate) {
        return oRelativeDateFormatter.format(new Date(oDate));
    };

    return NewsPanel;
});
