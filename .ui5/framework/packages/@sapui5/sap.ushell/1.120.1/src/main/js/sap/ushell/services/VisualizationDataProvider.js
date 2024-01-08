// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview Deals with the retrieval of visualization data in a platform independent way.
 *
 * It provides the (catalog) tile data of pages in the pages runtime.
 * Only used on the ABAP platform and on local for testing.
 *
 * Configured with the LaunchPageAdapter.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/resources",
    "sap/ui/thirdparty/jquery",
    "sap/ushell/library",
    "sap/ushell/utils/chipsUtils",
    "sap/base/Log",
    "sap/ushell/Config"
], function (
    resources,
    jQuery,
    ushellLibrary,
    chipsUtils,
    Log,
    Config
) {
    "use strict";

    // shortcut for sap.ushell.DisplayFormat
    var DisplayFormat = ushellLibrary.DisplayFormat;

    /**
     * @alias sap.ushell.services.VisualizationDataProvider
     * @class
     * @classdesc The Unified Shell's VisualizationDataProvider service.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("VisualizationDataProvider")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @since 1.68.0
     * @private
     */
    function VisualizationDataProvider () {
        this.S_COMPONENT_NAME = "sap.ushell.services.VisualizationDataProvider";
        this._init.apply(this, arguments);
    }

    /**
     * Private initializer.
     *
     * @param {object} launchPageAdapter The LaunchPageAdapter for the specific platform.
     * @since 1.68.0
     *
     * @private
     */
    VisualizationDataProvider.prototype._init = function (launchPageAdapter) {
        this.oLaunchPageAdapter = launchPageAdapter;
        this.oCatalogTilePromise = null;
    };

    /**
     * Returns raw catalog tile data that can be used to instantiate the tile
     *
     * @returns {Promise<object>} The catalog tile index
     *
     * @since 1.78.0
     * @private
     */
    VisualizationDataProvider.prototype._getCatalogTileIndex = function () {
        if (this._oCatalogTileIndexPromise) {
            return this._oCatalogTileIndexPromise;
        }

        var oLaunchPageAdapter = this.oLaunchPageAdapter;
        return oLaunchPageAdapter._getCatalogTileIndex();
    };

    /**
     * Retrieves and returns a map of all catalog tiles.
     *
     * @returns {Promise<object>} The map of catalog tiles
     * @since 1.70.0
     *
     * @private
     */
    VisualizationDataProvider.prototype._getCatalogTiles = function () {
        if (this.oCatalogTilePromise) {
            return this.oCatalogTilePromise;
        }

        var oLaunchPageAdapter = this.oLaunchPageAdapter;
        this.oCatalogTilePromise = new Promise(function (resolve, reject) {
            oLaunchPageAdapter.getCatalogs().then(function (catalogs) {
                var aDeferreds = [];
                var aCatalogTiles = [];
                var aFlattenedCatalogTiles = [];
                var oCatalogTiles = {};

                for (var i = 0; i < catalogs.length; i++) {
                    // REMOTE catalogs are deprecated and not supported in the pages runtime
                    if (typeof catalogs[i].ui2catalog === "undefined" || catalogs[i].ui2catalog.getType() !== "REMOTE") {
                        aDeferreds.push(oLaunchPageAdapter.getCatalogTiles(catalogs[i]).then(function (catalogTile) {
                            aCatalogTiles.push(catalogTile);
                        }));
                    }
                }

                jQuery.when.apply(null, aDeferreds).done(function () {
                    // Convert a two-dimensional array into a flat array
                    aFlattenedCatalogTiles = [].concat.apply([], aCatalogTiles);

                    for (var y = 0; y < aFlattenedCatalogTiles.length; y++) {
                        var sCatalogTileId = oLaunchPageAdapter.getCatalogTileId(aFlattenedCatalogTiles[y]);
                        if (Config.last("/core/stableIDs/enabled")) {
                            sCatalogTileId = oLaunchPageAdapter.getStableCatalogTileId(aFlattenedCatalogTiles[y]);
                        }
                        oCatalogTiles[sCatalogTileId] = aFlattenedCatalogTiles[y];
                    }

                    resolve(oCatalogTiles);
                }).fail(reject);
            }).fail(reject);
        });

        return this.oCatalogTilePromise;
    };

    /**
     * Returns An object containing visualizations, vizTypes & an empty page object.
     *
     * @returns {Promise<object>} An object containing visualizations, vizTypes & an empty page object.
     * @since 1.68.0
     *
     * @private
     */
    VisualizationDataProvider.prototype.getVisualizationData = function () {
        var oCatalogTileIndex;
        var oLaunchPageAdapter = this.oLaunchPageAdapter;

        if (this._oVisualizationDataPromise) {
            return this._oVisualizationDataPromise;
        }

        this._oVisualizationDataPromise = Promise.all([
            this._getCatalogTiles(),
            this._getCatalogTileIndex()
        ])
            .then(function (aResults) {
                var oCatalogTiles = aResults[0];
                oCatalogTileIndex = aResults[1];

                var aSupportedTileIds = [];
                var aIntentSupportedCheckPromises = [];

                Object.keys(oCatalogTiles).forEach(function (sKey) {
                    var oCatalogTile = oCatalogTiles[sKey];
                    // set to invisible, default for chips is visible
                    // this might lead to instant requests when tileView is fetched
                    oLaunchPageAdapter.setTileVisible(oCatalogTile, false);
                    aIntentSupportedCheckPromises.push(
                        oLaunchPageAdapter.isTileIntentSupportedAsync(oCatalogTile)
                            .then(function (bResult) {
                                if (bResult === true) {
                                    aSupportedTileIds.push(sKey);
                                }
                            })
                    );
                });

                return Promise.all(aIntentSupportedCheckPromises)
                    .then(function () {
                        var aCatalogTilePromises = aSupportedTileIds.map(function (sTileId) {
                            var oCatalogTile = oCatalogTiles[sTileId];
                            if (!oLaunchPageAdapter.getCatalogTilePreviewTitle(oCatalogTile)) {
                                return new Promise(function (resolve, reject) {
                                    oLaunchPageAdapter.getCatalogTileViewControl(oCatalogTile)
                                        .done(resolve)
                                        .fail(reject);
                                })
                                    .then(function (oView) {
                                        return {
                                            id: sTileId,
                                            catalogTile: oCatalogTile,
                                            view: oView
                                        };
                                    });
                            }
                            return Promise.resolve({
                                id: sTileId,
                                catalogTile: oCatalogTile
                            });
                        });

                        return Promise.all(aCatalogTilePromises);
                    });
            })
            .then(function (aData) {
                return aData.reduce(function (oResult, oData) {
                    var sId = oData.id;
                    var oView = oData.view;
                    var oCatalogTile = oData.catalogTile;

                    var sVizTypeId = oCatalogTile.getChip().getBaseChipId();

                    oResult.visualizations[sId] = {
                        vizType: sVizTypeId,
                        title: oLaunchPageAdapter.getCatalogTilePreviewTitle(oCatalogTile),
                        subTitle: oLaunchPageAdapter.getCatalogTilePreviewSubtitle(oCatalogTile),
                        icon: oLaunchPageAdapter.getCatalogTilePreviewIcon(oCatalogTile),
                        info: oLaunchPageAdapter.getCatalogTilePreviewInfo(oCatalogTile),
                        keywords: oLaunchPageAdapter.getCatalogTileKeywords(oCatalogTile),
                        size: oLaunchPageAdapter.getCatalogTileSize(oCatalogTile),
                        indicatorDataSource: oLaunchPageAdapter.getCatalogTilePreviewIndicatorDataSource(oCatalogTile),
                        url: oLaunchPageAdapter.getCatalogTileTargetURL(oCatalogTile),
                        numberUnit: oLaunchPageAdapter.getCatalogTileNumberUnit(oCatalogTile),
                        // The special custom tile logic is not needed on all the platforms so it doesn't have to be implemented
                        isCustomTile: oLaunchPageAdapter.isCustomTile && oLaunchPageAdapter.isCustomTile(oCatalogTile)
                    };

                    if (oView) {
                        oView.destroy();
                    }

                    if (oCatalogTileIndex[sId]) {
                        // The catalog tile index is only available on the ABAP platform.
                        oResult.visualizations[sId]._instantiationData = {
                            platform: "ABAP",
                            simplifiedChipFormat: false,
                            chip: oCatalogTileIndex[sId]
                        };
                    }

                    if (oResult.visualizations[sId].isCustomTile && !oResult.vizTypes[sVizTypeId]) {
                        oResult.vizTypes[sVizTypeId] = {
                            id: sVizTypeId,
                            url: undefined,
                            vizOptions: {
                                displayFormats: this._getDisplayFormats(oCatalogTile, oResult.visualizations[sId].size)
                            },
                            tileSize: oResult.visualizations[sId].size
                        };
                    }

                    return oResult;
                }.bind(this), {
                    visualizations: {},
                    vizTypes: {},
                    page: {}
                });
            }.bind(this))
            .catch(function (error) {
                var oError = {
                    component: this.S_COMPONENT_NAME,
                    description: resources.i18n.getText("VisualizationDataProvider.CannotLoadData"),
                    detail: error
                };
                return Promise.reject(oError);
            }.bind(this));

        return this._oVisualizationDataPromise;
    };

    /**
     * Returns the supported & default display format options for a particular catalog tile.
     *
     * @param {object} oCatalogTile A catalog tile (CHIP Instance)
     * @param {string} sTileSize The tileSize of the catalog tile eg. '1x2'
     *
     * @returns {object} Display formats
     *
     * @since 1.90.0
     * @private
     */
    VisualizationDataProvider.prototype._getDisplayFormats = function (oCatalogTile, sTileSize) {
        // Default displayFormat configuration if the types contract is not available.
        var aAvailableTypes = ["tile"];
        var sDefaultType = "tile";

        var oTypeContracts = oCatalogTile.getContract("types");
        if (oTypeContracts) {
            // Get available types & default type from chip contract.
            aAvailableTypes = oTypeContracts.getAvailableTypes();
            sDefaultType = oTypeContracts.getDefaultType();
        }

        return {
            supported: this._mapDisplayFormats(aAvailableTypes, sTileSize),
            default: this._mapDisplayFormats([sDefaultType], sTileSize)[0]
        };
    };

    /**
     * Maps The displayFormats to the correct naming and takes the tileSize into account
     *
     * @param {string[]} aDisplayFormats The displayFormats defined in the types contract
     * @param {string} sTileSize The tile size e.g. '1x2'
     *
     * @returns {string[]} The mapped displayFormats
     *
     * @private
     * @since 1.90.0
     */
    VisualizationDataProvider.prototype._mapDisplayFormats = function (aDisplayFormats, sTileSize) {
        // Although types like tileWide are defined in the CHIP.xml in camel case
        // the CHIP API returns all types in lowercase.
        var oDisplayFormatMapping = {
            tile: DisplayFormat.Standard,
            tilewide: DisplayFormat.StandardWide,
            link: DisplayFormat.Compact,
            flat: DisplayFormat.Flat,
            flatwide: DisplayFormat.FlatWide
        };

        return aDisplayFormats.map(function (sDisplayFormat) {
            sDisplayFormat = oDisplayFormatMapping[sDisplayFormat];

            if (sDisplayFormat === DisplayFormat.Standard && sTileSize === "1x2") {
                return DisplayFormat.StandardWide;
            }

            return sDisplayFormat;
        });
    };

    /**
     * Constructs a vizType object from the base chip data and returns it.
     *
     * @param {string} sBaseChipId the base chip id
     * @returns {Promise<object>} a vizType object
     * @since 1.91.0
     * @private
     */
    VisualizationDataProvider.prototype.loadVizType = function (sBaseChipId) {
        var oSimplifiedChip = {
            chipId: sBaseChipId
        };
        return chipsUtils.loadChipInstanceFromSimplifiedChip(oSimplifiedChip)
            .then(function (oChipInstance) {
                var sSize = chipsUtils.getTileSize(oChipInstance);

                return {
                    id: sBaseChipId,
                    url: undefined,
                    vizOptions: {
                        displayFormats: this._getDisplayFormats(oChipInstance, sSize)
                    },
                    tileSize: sSize
                };
            }.bind(this))
            .catch(function (sError) {
                Log.error("The chipInstance '" + sBaseChipId + "' could not be loaded: ", sError);
            });
    };

    VisualizationDataProvider.hasNoAdapter = false;
    return VisualizationDataProvider;
});
