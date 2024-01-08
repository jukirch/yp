sap.ui.define([
    "sap/suite/ui/commons/BaseContainer"
], function (
    BaseContainer
) {
    "use strict";
    var NewsAndPagesContainer = BaseContainer.extend("sap.suite.ui.commons.NewsAndPagesContainer", {
        metadata : {
            properties : {
                /**
				 * Title for the container
				 *
				 * @private
				 */
                title: { type: "string", group: "Misc", visibility: "hidden"},
                 /**
				 * Layout for the container
				 *
				 * @private
				 */
                layout: { type: "sap.suite.ui.commons.LayoutType", group: "Misc",  visibility: "hidden" },
                 /**
				 * This property is not used currently
				 * @private
				 */
                selectedKey: { type: "string", group: "Misc",  visibility: "hidden"}
            },
            defaultAggregation: "content",
            aggregations: {
                content: { type: "sap.suite.ui.commons.BasePanel", singularName: "content", multiple: true },
                actionButtons: { type: "sap.suite.ui.commons.ActionButton", multiple: true, singularName: "actionButton" ,  visibility: "hidden"},
                menuButtons: { type: "sap.suite.ui.commons.MenuButton", multiple: true, singularName: "menuButton" ,  visibility: "hidden"}
            }
        },
        renderer: {
            apiVersion: 2
        }
    });

    NewsAndPagesContainer.prototype.init = function () {

        this.panelLoaded = {};
        this.panelRemoved = {
            "News": false,
            "Page": false
        };
        this.setLayout("Horizontal");
        BaseContainer.prototype.init.apply(this, arguments);
    };


    NewsAndPagesContainer.prototype.onBeforeRendering = function () {
        BaseContainer.prototype.onBeforeRendering.apply(this, arguments);
        var aContent =   this.getContent();
        aContent.forEach(function(oContent){
            oContent.getData();
        });
    };

    /**
     * Callback function from child panels to inform parent once  loaded
     * @param {String}  sPanelType : Page or News
     * @param {Object} oVal , can contain keys loaded, count.
     * loaded : with true or false indicate whether data loaded, count: for Favorite pages count eg. {loaded: true, count :0}
     * @private
     * @experimental Since 1.120
     */
    NewsAndPagesContainer.prototype._panelLoadedFn = function (sPanelType, oVal) {
        // same issue of panelwrapper not available at this time
        var aContent = this.getContent();
        aContent.forEach(function(oContent) {
            if (oContent.getMetadata().getName()   === 'sap.suite.ui.commons.PagePanel') {
                this.pagePanel = oContent;
            } else if (oContent.getMetadata().getName()   === 'sap.suite.ui.commons.NewsPanel') {
                this.newsPanel = oContent;
            }
        }.bind(this));
        this.panelLoaded[sPanelType] = oVal;

        // if both panels available adjustlayout styles only after both panels callback done
        if (aContent.length === 2 && this.panelLoaded["Page"] && this.panelLoaded["News"]) {
            this._adjustLayoutStyles();
        } else if (aContent.length === 1 && (this.panelLoaded["Page"] || this.panelLoaded["News"])) {
             // if single panel available, invoke adjustlayoutstyles  after that panel's callback is done
            this._adjustLayoutStyles();
        }
    };

    /**
     * Adjust layout styles for the content
     * need to make calculation in container and set properties for  the panels
     * @private
     * @experimental Since 1.120
     */
    NewsAndPagesContainer.prototype._adjustLayoutStyles = function () {

            if ( this.panelLoaded["Page"]?.loaded && this.panelLoaded["News"]?.loaded) {
                this.iFavPagesCount = this.panelLoaded["Page"].count;
                this.bIsNewsTileVisible = true;
                this.pagePanel.attachResizeHandler(this.bIsNewsTileVisible,this.getDomRef()?.clientWidth);
            } else if (this.panelLoaded["Page"]?.loaded ) {
                this.iFavPagesCount = this.panelLoaded["Page"].count;
                this.bIsNewsTileVisible = false;
                this.removeContent(this.newsPanel);
                this.panelRemoved["News"] = true;
                this.pagePanel.attachResizeHandler(this.bIsNewsTileVisible, this.getDomRef()?.clientWidth);
            } else if (this.panelLoaded["News"]?.loaded) {
                this.bIsNewsTileVisible = true;
                this.iFavPagesCount = 0;
                this.removeContent(this.pagePanel);
                this.panelRemoved["Page"] = true;
            } else {
                this.bIsNewsTileVisible = false;
                this.iFavPagesCount = 0;
                this.removeContent(this.pagePanel);
                this.removeContent(this.newsPanel);
                this.panelRemoved["News"] = true;
                this.panelRemoved["Page"] = true;
            }
    };



    return NewsAndPagesContainer;
});
