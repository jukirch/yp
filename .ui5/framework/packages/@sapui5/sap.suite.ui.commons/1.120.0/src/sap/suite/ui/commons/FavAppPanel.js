sap.ui.define([
    "sap/suite/ui/commons/BaseAppPanel",
    "sap/suite/ui/commons/App",
    "sap/suite/ui/commons/Group",
    "sap/ushell/utils/WindowUtils",
    "sap/base/Log"
], function (
    BaseAppPanel,
    App,
    Group,
    WindowUtils,
    Log
) {
    "use strict";

    const FavAppPanel = BaseAppPanel.extend("sap.suite.ui.commons.FavAppPanel", {
        metadata : {
            defaultAggregation: "apps",
            aggregations: {
                groups: { type: "sap.suite.ui.commons.Group",singularName: "group", multiple: true, visibility: "hidden" }
            }
        }
    });

    const AppConstants = {
        MYHOME_PAGE_ID: "SAP_BASIS_PG_UI_MYHOME",
        FALLBACK_ICON: "sap-icon://document",
        MYINSIGHT_SECTION_ID: "AZHJGRIT78TG7Y65RF6EPFJ9U"
    };

    FavAppPanel.prototype._isSmartBusinessTile = function(oVisualization){
        return oVisualization.vizType.startsWith("X-SAP-UI2-CHIP:SSB");
    };

    FavAppPanel.prototype._fetchRequestFromQueue =  async function(sPageId, bForceRefresh){
        const oSpaceContentService = await sap.ushell.Container.getServiceAsync("SpaceContent");
        let oPageLoadPromise;
        this.aRequestQueue = this.aRequestQueue || [];
        //Check if request already exists in the queue, if not add it
        const oRequestedPage = this.aRequestQueue.find((oRequest) => oRequest.pageId === sPageId);
        if (!oRequestedPage || bForceRefresh === true) {
            oPageLoadPromise = oSpaceContentService.getPage(sPageId);
            if (oRequestedPage) {
                oRequestedPage.pageLoadPromise = oPageLoadPromise;
            } else {
                this.aRequestQueue.push({
                    pageId: sPageId,
                    pageLoadPromise: oPageLoadPromise
                });
            }
        } else {
            oPageLoadPromise = oRequestedPage.pageLoadPromise;
        }
        return oPageLoadPromise;
    };

    FavAppPanel.prototype._getSections =  async function(bForceRefresh){
        const oPage = await this._fetchRequestFromQueue(AppConstants.MYHOME_PAGE_ID, bForceRefresh);
        const aSections = oPage?.sections || [],
            iRecentAppSectionIndex = aSections.findIndex((oSection) => oSection.default);

        if (iRecentAppSectionIndex > 0) {
            if (!this._oMoveAppsPromise) {
                this._oMoveAppsPromise = this._moveSection(AppConstants.MYHOME_PAGE_ID, iRecentAppSectionIndex, 0).then(() => this._getSections(true));
            }
            return this._oMoveAppsPromise;
        } else {
            return aSections;
        }
    };

    FavAppPanel.prototype._fetchApps = async function(bForceRefresh){
        const aApps = [];
        try {
            const aSections = await this._getSections(bForceRefresh);
            aSections.forEach((oSection, iSectionIndex) => {
                oSection.visualizations.forEach((oVisualization, iVisualizationIndex) => {
                    const {vizConfig, targetURL, title, subtitle, indicatorDataSource} = oVisualization,
                            oAppInfo = vizConfig["sap.app"] || { title: "?" },
                            oAppTitle = title || this._getAppTitleSubTitle(oAppInfo, oVisualization).title,
                            oAppSubTitle = subtitle || this._getAppTitleSubTitle(oAppInfo, oVisualization).subTitle;
                    let oAppURL = targetURL;
                    if (!oAppURL && this._isSmartBusinessTile(oVisualization)){
                        oAppURL = this._getTargetUrl(vizConfig["sap.flp"]);
                    }
                    const oApp = {
                        oldAppId: this._getAppId(vizConfig["sap.flp"]),
                        appId: targetURL, // Using targetURL as unique identifier as in certian scenario vizConfig can be empty.
                        url: oAppURL,
                        leanURL: WindowUtils.getLeanURL(oAppURL),
                        title: oAppTitle,
                        subtitle: oAppSubTitle,
                        BGColor: this.getDefaultAppColor().key,
                        isFav: true,
                        isSection: false,
                        icon: vizConfig["sap.ui"]?.icons?.icon || AppConstants.FALLBACK_ICON,
                        isSmartBusinessTile: this._isSmartBusinessTile(oVisualization),
                        // Add FLP Personalization Config
                        persConfig: {
                            pageId: AppConstants.MYHOME_PAGE_ID,
                            sectionTitle: oSection.title,
                            sectionId: oSection.id,
                            sectionIndex: iSectionIndex,
                            visualizationIndex: iVisualizationIndex,
                            isDefaultSection: oSection.default,
                            isPresetSection: oSection.preset,
                            duplicateApps: []
                        },
                        visualization: {
                            ...oVisualization,
                            // Title and Subtitle in visualization are required in Insights Dialog.
                            title: oAppTitle,
                            subtitle: oAppSubTitle
                        }
                    };
                    if (indicatorDataSource) {
                        oApp.isCount = true;
                        oApp.indicatorDataSource = indicatorDataSource.path;
                        oApp.contentProviderId = oVisualization.contentProviderId;
                    }
                    aApps.push(oApp);
                });
            });
            return aApps;
        } catch (oErr){
            return aApps;
        }
    };

    FavAppPanel.prototype._getAppId = function(vizConfigFLP){
        let sAppId = "";
        let oTileProperties = {};
        if (vizConfigFLP) {
            const {semanticObject, action} = vizConfigFLP.target;
            if (semanticObject && action) {
                sAppId =  `#${semanticObject}-${action}`;
            } else if (vizConfigFLP?._instantiationData?.chip?.configuration) {
                oTileProperties = this._getTileProperties(vizConfigFLP);
                if (oTileProperties.semanticObject && oTileProperties.semanticAction){
                    sAppId =  `#${oTileProperties.semanticObject}-${oTileProperties.semanticAction}`;
                }
            }
        }
        return sAppId;
    };

    FavAppPanel.prototype._getTileProperties = function(vizConfigFLP){
        let oTileProperties = {};
        const oChipConfig = vizConfigFLP?._instantiationData?.chip?.configuration;
        if (oChipConfig){
          const oConfig = this._parseSBParameters(oChipConfig);
          const oTileConfiguration = oConfig?.tileConfiguration;
          if (oTileConfiguration) {
            const oTileConfig = this._parseSBParameters(oConfig.tileConfiguration);
            if (oTileConfig) {
                oTileProperties = this._parseSBParameters(oTileConfig.TILE_PROPERTIES);
            }
          }
        }
        return oTileProperties;
    };

    FavAppPanel.prototype._parseSBParameters = function(oParam) {
        let oParsedParams = {};
        if (oParam) {
            if (typeof oParam === "object") {
                oParsedParams = oParam;
            } else {
                try {
                    oParsedParams = JSON.parse(oParam);
                } catch (oError) {
                    oParsedParams = undefined;
                }
            }
        }
        return oParsedParams;
    };

    FavAppPanel.prototype._getTargetUrl = function(vizConfigFLP){
        const sTargetURL = this._getAppId(vizConfigFLP) || "";
        const oTileProperties = this._getTileProperties(vizConfigFLP);
        return oTileProperties.evaluationId ? (sTargetURL + "?EvaluationId=" + oTileProperties.evaluationId) : sTargetURL;
    };

    FavAppPanel.prototype._getAppTitleSubTitle = function(oApp, vizConfigFLP) {
        const oAppTileInfo = vizConfigFLP?._instantiationData?.chip?.bags?.sb_tileProperties?.texts;
        return {
            title: oApp.title || oAppTileInfo?.title || "",
            subTitle: oApp.subtitle || oAppTileInfo?.description || ""
        };
    };

    /**
     * Move a section
     *
     * @param {string} sPageId - page id
     * @param {number} iSourceSectionIndex - source index
     * @param {number} iTargetSectionIndex - target index
     * @returns {Promise} resolves after moving the section
     */
    FavAppPanel.prototype._moveSection = async function(sPageId, iSourceSectionIndex, iTargetSectionIndex) {
        const oPagesService = await sap.ushell.Container.getServiceAsync("Pages");
        const iPageIndex = oPagesService.getPageIndex(sPageId);
        return oPagesService._moveSection(iPageIndex, iSourceSectionIndex, iTargetSectionIndex);
    };

    /**
     * Filters out a list of apps from duplicate apps
     *
     * @param {object[]} aVisibleFavoriteApps - array of apps
     * @param {boolean} bReturnDuplicateApps - flag when set to true, returns only the duplicate apps
     * @returns {object[]} filtered array
     */
    FavAppPanel.prototype._filterDuplicateApps = function(aVisibleFavoriteApps, bReturnDuplicateApps) {
        return aVisibleFavoriteApps.filter((oApp, iAppIndex, aApps) => {
            var iFirstIndex = aApps.findIndex((oTempApp) => oTempApp.appId === oApp.appId);
            return bReturnDuplicateApps ? iFirstIndex !== iAppIndex : iFirstIndex === iAppIndex;
        });
    };

    /**
     * Add Grouping Information to apps list, and return concatenated list.
     *
     * @param {object[]} aFavoriteApps - list of all favorite apps
     * @returns {object[]} - concatenated list contaning grouping information as well
     */
    FavAppPanel.prototype._addGroupInformation = function (aFavoriteApps) {
        var aRecentApps = [], aSections = [], oExistingSection;

        this._linkDuplicateApps(aFavoriteApps).forEach(function (oApp) {
            if (oApp.persConfig.isDefaultSection) {
                aRecentApps.push(oApp);
            } else {
                oExistingSection = aSections.find((oSection) => oSection.isSection && oSection.id === oApp.persConfig.sectionId);

                if (!oExistingSection) {
                    aSections.push({
                        id: oApp.persConfig.sectionId,
                        index: oApp.persConfig.sectionIndex,
                        title: oApp.persConfig.sectionTitle,
                        badge: "1",
                        BGColor: this.getDefaultAppColor().key,
                        icon: "sap-icon://folder-full",
                        isSection: true,
                        isPresetSection: oApp.persConfig.isPresetSection,
                        apps: [ oApp ]
                    });
                } else {
                    oExistingSection.apps.push(oApp);
                    oExistingSection.badge = oExistingSection.apps.length.toString();
                }
            }
        });

        //filter out duplicate apps only from recent apps list
        return aSections.concat(this._filterDuplicateApps(aRecentApps, false));
    };

    /**
     * Link Duplicate Apps to a single app
     *
     * @param {object[]} aApps - array of apps
     * @returns {object[]} arry of apps after linking duplicate apps
     */
    FavAppPanel.prototype._linkDuplicateApps = function(aApps){
        aApps.forEach(function(oDuplicateApp) {
            aApps.filter(function(oApp) {
                return oApp.appId === oDuplicateApp.appId
                    && oApp.visualization.id !== oDuplicateApp.visualization.id
                    && oApp.persConfig.sectionIndex === oDuplicateApp.persConfig.sectionIndex;
            }).forEach(function(oApp) {
                oApp.persConfig.duplicateApps.push(oDuplicateApp);
            });
        });

        return aApps;
    };

	/**
     * Returns favorite apps
     *
     * @param {boolean} bForceRefresh - force reload page
     * @param {boolean} bPreventGrouping - prevent app grouping
     * @returns {Promise} - resolves to return all apps in MyHome page
     */
    FavAppPanel.prototype._fetchFavApps = async function(bForceRefresh, bPreventGrouping){
        const aApps = await this._fetchApps(bForceRefresh);
        var aVisibleFavApps = aApps.filter(function (oApp) {
            return oApp.persConfig?.sectionId !== AppConstants.MYINSIGHT_SECTION_ID && oApp.url && oApp.title;
        });

        if (bPreventGrouping) {
            return this._filterDuplicateApps(this._linkDuplicateApps(aVisibleFavApps), false);
        } else {
            return this._addGroupInformation(aVisibleFavApps);
        }
    };

    FavAppPanel.prototype.init = async function () {
        try {
            //Configure Header
            this.setKey("favApps");
            this.setTitle(this.getResourceBundle().getText("favoritesTab"));
            const aFavApps = await this._fetchFavApps(true, true);
            aFavApps.forEach((app, index) => {
                this.addApp(new App({
                    id: `favApps-${index}`,
                    title: app.title,
                    bgColor: app.BGColor,
                    icon: app.icon,
                    url: app.url
                }));
            });
            this.setInnerControls();
        } catch (error) {
            Log.error(error);
        }
        BaseAppPanel.prototype.init.apply(this, arguments);
    };

    /**
     * Get the text for the "No Data" message.
     *
     * @returns {string} The text for the "No Data" message.
     */
    FavAppPanel.prototype.getNoDataText = function () {
        return this.getResourceBundle().getText("noFavAppsDescription");
    };

    return FavAppPanel;
});