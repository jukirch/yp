//Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview ContentFinder Component
 *
 * @version 1.120.1
 */

sap.ui.define([
    "sap/base/Log",
    "sap/base/util/deepExtend",
    "sap/base/util/ObjectPath",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (Log, deepExtend, ObjectPath, UIComponent, JSONModel) {
    "use strict";

    /**
     * Event for the visualizations to be added
     *
     * @event sap.ushell.components.contentFinder.Component#visualizationsAdded
     * @type {object}
     * @property {array} visualizationIds The list of visualization IDs to be added.
     */

    /**
     * Event to query visualizations with a set of types, searchTerm and pagination.
     *
     * @event sap.ushell.components.contentFinder.Component#visualizationFilterApplied
     * @type {object}
     * @property {{pagination: {skip: int, top: int}}} filter data Filter data object containing pagination and filter information.
     */

    /**
     * Event if a widget (type) without target was selected in the widget gallery.
     *
     * @event sap.ushell.components.contentFinder.Component#visualizationsAdded
     * @type {object}
     * @property {string} widgetId The ID of the selected widget type
     */


    /**
     * The available navigation targets
     */
    var oNavigationTargets = {
        widgetGallery: "widgetGallery",
        appSearchTiles: "appSearch_tiles",
        appSearchCards: "appSearch_cards"
        // TODO: appSearch_mixed: "appSearch_cards"
    };

    var oNavigationTargetTypeMapping = {
        appSearch_tiles: ["sap.ushell.StaticAppLauncher", "sap.ushell.DynamicAppLauncher"],
        appSearch_cards: ["sap.card"]
    };

    /**
     * Initial data to be set to the ContentFinder model.
     *
     * @type {object}
     */
    var oInitialData = {
        navigationTargets: oNavigationTargets,

        // The current/active navigation target within the ContentFinderDialog
        activeNavigationTarget: oNavigationTargets.widgetGallery,

        // A content finder in restricted mode shows no widget Gallery and starts directly with the appSearch.
        // Additionally, no "Back" button is rendered, as the end user cannot navigate to the WidgetGallery.
        restrictedMode: false,

        widgetGallery: {
            widgetGroups: []
        },

        appSearch: {
            growingThreshold: 30,
            visualizationsLoaded: false,
            selectedAppCount: 0,
            hasSelectables: true,
            currentSelectedTreeNode: "",
            searchTerm: "",
            filteredAppCount: 0,
            showSelectedPressed: false,
            originalVisualizations: {
                cards: [],
                tiles: []
            },
            visualizations: {
                cards: [],
                tiles: []
            },
            totalCount: 0,
            originalRestrictedVisualizations: [],
            restrictedVisualizations: []
        }
    };

    /**
     * Component of the ContentFinder view.
     *
     * @param {string} sId Component id.
     * @param {object} mSettings Optional map for component settings.
     * @class
     * @extends sap.ui.core.UIComponent
     * @private
     * @since 1.113.0
     * @alias sap.ushell.components.contentFinder.Component
     */
    return UIComponent.extend("sap.ushell.components.contentFinder.Component", /** @lends sap.ushell.components.contentFinder.Component */{
        metadata: {
            manifest: "json",
            library: "sap.ushell"
        },

        /**
         * The string of the current contentFinder component for usage in Error Logs
         * @type {string}
        */
        logComponent: "sap.ushell.components.ContentFinder.Component",

        /**
         * The init function called when the component is initialized.
         *
         * @since 1.113.0
         * @private
         */
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.oResourceBundle = this.getModel("i18n").getResourceBundle();
            this.oRootView = this.getRootControl();
            this.aRegisteredEvents = [];

            var oModel = new JSONModel();
            oModel.setSizeLimit(Infinity);
            this.setModel(oModel);
            this._initializeModel();

            this._oRootControlLoadedPromise = this.rootControlLoaded().then(function () {
                this.oNavContainer = this.oRootView.byId("contentFinderNavContainer");
                this.oContentFinderWidgetGalleryPage = this.oRootView.byId("contentFinderWidgetGalleryPage");
                this.oContentFinderAppSearchPage = this.oRootView.byId("contentFinderAppSearchPage");
                this.oDialog = this.oRootView.byId("contentFinderDialog");
            }.bind(this));
        },

        /**
         * Opens the content finder and shows the provided target (WidgetGallery or AppSearch).
         * Possible targets are: Widget Gallery (default): <code>widgetGallery</code>, App Search: <code>appSearch_tiles</code>.
         *
         * @param {string} [sTarget] Target view which is navigated to.
         *
         * @since 1.113.0
         * @returns {Promise<undefined>} Resolves with <code>undefined</code>.
         * @public
         */
        show: function (sTarget) {
            if (sTarget && !Object.values(oNavigationTargets).includes(sTarget)) {
                return Promise.reject(new Error("Invalid navigation target provided. Could not open ContentFinder dialog."));
            }
            sTarget = sTarget || oNavigationTargets.widgetGallery;

            return this.navigate(sTarget).then(function () {
                this.oDialog.open();
            }.bind(this));
        },

        /**
         * Sets the widget groups (e.g. applications, premium widgets) for the content finder instance.
         *
         * A row of the VBox as part of the WidgetGallery represents a single widget group.
         * A widget type represents a specific widget type like tiles or cards.
         *
         * @param {array} aWidgetGroups An array of widget groups.
         * @since 1.113.0
         * @public
         */
        setWidgetGroups: function (aWidgetGroups) {
            this.getModel().setProperty("/widgetGallery/widgetGroups", aWidgetGroups);
        },

        /**
         * Fires the event to query for visualizations.
         *
         * @since 1.115.0
         * @param {int} iSkip Number of entries already displayed.
         * @param {string} [sSearchTerm] The search term.
         *
         * @private
         */
        queryVisualizations: function (iSkip, sSearchTerm) {
            var oModel = this.getModel();
            var sActiveNavigationTarget = oModel.getProperty("/activeNavigationTarget");
            var aTypes = oNavigationTargetTypeMapping[sActiveNavigationTarget] || [];

            if (!this._bLoading) {
                this._bLoading = true;
                oModel.setProperty("/appSearch/visualizationsLoaded", false);

                this.fireEvent("visualizationFilterApplied", {
                    pagination: {
                        skip: iSkip,
                        top: oModel.getProperty("/appSearch/growingThreshold")
                    },
                    types: aTypes,
                    search: sSearchTerm || null
                });
            }
        },

        /**
         * Sets the visualization data for the Content Finder model.
         *
         * @param {object} oVisualizationData An object containing all the visualization data as arrays.
         * @since 1.113.0
         * @public
         */
        setVisualizationData: function (oVisualizationData) {
            var aVisualizations = ObjectPath.get("visualizations.nodes", oVisualizationData) || [];
            var iTotalCount = ObjectPath.get("visualizations.totalCount", oVisualizationData) || 0;
            var oModel = this.getModel();

            // Prepare AppBox object structure for tiles and cards
            var aTiles = this._prepareTiles(aVisualizations);
            var aCards = this._prepareCards(aVisualizations);

            // Set data to the main model
            oModel.setProperty("/appSearch/originalVisualizations/tiles", deepExtend([], aTiles));
            oModel.setProperty("/appSearch/originalVisualizations/cards", deepExtend([], aCards));

            oModel.setProperty("/appSearch/visualizations/tiles", deepExtend([], aTiles));
            oModel.setProperty("/appSearch/visualizations/cards", deepExtend([], aCards));
            oModel.setProperty("/appSearch/totalCount", iTotalCount);
            oModel.setProperty("/appSearch/visualizationsLoaded", true);

            this._updateVisualizationsRestricted();
            this._bLoading = false;
        },

        /**
         * Concatenates the visualization data for the Content Finder model.
         * Will replace 'setVisualizationData' once pagination is available.
         *
         * @param {object} oVisualizationData An object containing all the visualization data as arrays.
         * @since 1.115.0
         * @private
         */
        setVisualizationDataPaginated: function (oVisualizationData) {
            var aVisualizations = ObjectPath.get("visualizations.nodes", oVisualizationData) || [];
            var iTotalCount = ObjectPath.get("visualizations.totalCount", oVisualizationData) || 0;
            var oModel = this.getModel();

            // Prepare AppBox object structure for tiles and cards
            var aTiles = this._prepareTiles(aVisualizations);
            var aCards = this._prepareCards(aVisualizations);

            var aExistingOriginalTiles = oModel.getProperty("/appSearch/originalVisualizations/tiles");
            var aExistingOriginalCards = oModel.getProperty("/appSearch/originalVisualizations/cards");

            var aExistingTiles = oModel.getProperty("/appSearch/visualizations/tiles");
            var aExistingCards = oModel.getProperty("/appSearch/visualizations/cards");

            // Set data to the main model
            oModel.setProperty("/appSearch/originalVisualizations/tiles", aExistingOriginalTiles.concat(deepExtend([], aTiles)));
            oModel.setProperty("/appSearch/originalVisualizations/cards", aExistingOriginalCards.concat(deepExtend([], aCards)));

            oModel.setProperty("/appSearch/visualizations/tiles", aExistingTiles.concat(deepExtend([], aTiles)));
            oModel.setProperty("/appSearch/visualizations/cards", aExistingCards.concat(deepExtend([], aCards)));
            oModel.setProperty("/appSearch/totalCount", iTotalCount);
            oModel.setProperty("/appSearch/visualizationsLoaded", true);

            this._updateVisualizationsRestricted();
            this._bLoading = false;
        },

        /**
         * Sets the restricted mode for the Content Finder.
         *
         * A content finder in restricted mode shows no "Back" button as part of the AppSearch view.
         *
         * @param {boolean} bRestrictedMode A boolean representing whether the content finder is restricted or not.
         * @since 1.113.0
         * @public
         */
        setRestrictedMode: function (bRestrictedMode) {
            this.getModel().setProperty("/restrictedMode", !!bRestrictedMode);
        },

        /**
         * Adds context data to visualization data.
         *
         * This context can be used to set restricted visualizations.
         * Restricted visualizations are non-selectable widgets which are already present on the page.
         *
         * @param {object} oContextData The context data with the restricted visualizations.
         * @since 1.113.0
         * @public
         */
        setContextData: function (oContextData) {
            var aRestrictedVisualizations = ObjectPath.get("restrictedVisualizations", oContextData) || [];
            var oModel = this.getModel();

            oModel.setProperty("/appSearch/originalRestrictedVisualizations", deepExtend([], aRestrictedVisualizations));

            oModel.setProperty("/appSearch/restrictedVisualizations", deepExtend([], aRestrictedVisualizations));

            this._updateVisualizationsRestricted();
        },

        /**
         * Returns the NavContainer.
         *
         * @returns {Promise<sap.m.NavContainer>} Resolves with the NavContainer.
         * @since 1.113.0
         * @private
         */
        getNavContainer: function () {
            return this._oRootControlLoadedPromise.then(function () {
                return this.oNavContainer;
            }.bind(this));
        },

        /**
         * Returns all selected app boxes.
         *
         * @returns {array} Returns an array containing all selected app boxes.
         * @since 1.113.0
         * @private
         */
        getSelectedAppBoxes: function () {
            var oVisualizations = this.getModel().getProperty("/appSearch/visualizations");
            var aAllSelectedAppBoxes = [];

            Object.values(oVisualizations).forEach(function (aWidgetTypeData) {
                var aSelectedAppBoxes = aWidgetTypeData.filter(function (oAppBox) {
                    return oAppBox.selected;
                });

                aAllSelectedAppBoxes = aAllSelectedAppBoxes.concat(aSelectedAppBoxes);
            });

            return aAllSelectedAppBoxes;
        },

        /**
         * Fires the <code>visualizationAdded</code> event which provides the added visualizations.
         *
         * @fires sap.ushell.components.contentFinder.Component#visualizationsAdded
         * @since 1.113.0
         * @private
         */
        addVisualizations: function () {
            var aSelectedAppBoxes = this.getSelectedAppBoxes();
            if (aSelectedAppBoxes.length > 0) {
                this.fireEvent("visualizationsAdded", {
                    visualizations: aSelectedAppBoxes
                });
            }
        },

        /**
         * Attaches an event handler to the 'contentFinderClosed' event.
         *
         * When called, the context of the event handler will be bound to 'oListener' if specified, otherwise it will be bound to this.
         *
         * @param {function} fnFunction The callback to be called, when the event is triggered
         * @param {object} [oListener] Context object to call the event handler with. Defaults to this.
         * @returns {this} Reference to 'this' in order to allow method chaining
         * @since 1.113.0
         * @private
         */
        attachContentFinderClosed: function (fnFunction, oListener) {
            this.aRegisteredEvents.push({ id: "contentFinderClosed", callback: fnFunction, listener: oListener });

            this.attachEventOnce("contentFinderClosed", fnFunction, oListener);
            return this;
        },

        /**
         * Attaches an event handler to the 'widgetSelected' event.
         *
         * When called, the context of the event handler will be bound to 'oListener' if specified, otherwise it will be bound to this.
         *
         * @param {object} oData An application-specific payload object that will be passed to the event handler.
         * @param {function} fnFunction The callback to be called, when the event is triggered
         * @param {object} [oListener] Context object to call the event handler with. Defaults to this.
         * @returns {this} Reference to 'this' in order to allow method chaining
         * @since 1.113.0
         * @private
         */
        attachWidgetSelected: function (oData, fnFunction, oListener) {
            this.aRegisteredEvents.push({ id: "widgetSelected", callback: fnFunction, listener: oListener });

            this.attachEventOnce("widgetSelected", oData, fnFunction, oListener);
            return this;
        },

        /**
         * Attaches an event handler to the 'visualizationsAdded' event.
         *
         * When called, the context of the event handler will be bound to 'oListener' if specified, otherwise it will be bound to this.
         *
         * @param {object} oData An application-specific payload object that will be passed to the event handler.
         * @param {function} fnFunction The callback to be called, when the event is triggered
         * @param {object} [oListener] Context object to call the event handler with. Defaults to this.
         * @returns {this} Reference to 'this' in order to allow method chaining
         * @since 1.113.0
         * @private
         */
        attachVisualizationsAdded: function (oData, fnFunction, oListener) {
            this.aRegisteredEvents.push({ id: "visualizationsAdded", callback: fnFunction, listener: oListener });

            this.attachEventOnce("visualizationsAdded", oData, fnFunction, oListener);
            return this;
        },

        /**
         * Attaches an event handler to the 'visualizationFilterApplied' event.
         *
         * When called, the context of the event handler will be bound to 'oListener' if specified, otherwise it will
         * be bound to this.
         *
         * @param {object} oData An application-specific payload object that will be passed to the event handler.
         * @param {function} fnFunction The callback to be called, when the event is triggered
         * @param {object} [oListener] Context object to call the event handler with. Defaults to this.
         * @returns {this} Reference to 'this' in order to allow method chaining
         * @since 1.115.0
         * @private
         */
        attachVisualizationFilterApplied: function (oData, fnFunction, oListener) {
            this.aRegisteredEvents.push({ id: "visualizationFilterApplied", callback: fnFunction, listener: oListener });

            this.attachEvent("visualizationFilterApplied", oData, fnFunction, oListener);
            return this;
        },


        /**
         * Resets the AppSearch, but keeps originally passed visualizations in the model.
         *
         * Resetting the AppSearch is necessary when navigating away from the AppSearch.
         *
         * @since 1.113.0
         * @private
         */
        resetAppSearch: function () {
            var oData = this.getModel().getData();

            var oInitialDataTmp = deepExtend({}, oInitialData.appSearch);
            oInitialDataTmp.originalVisualizations = deepExtend({}, oData.appSearch.originalVisualizations);
            oInitialDataTmp.originalRestrictedVisualizations = [].concat(oData.appSearch.originalRestrictedVisualizations);

            oInitialDataTmp.visualizations = deepExtend({}, oData.appSearch.originalVisualizations);
            oInitialDataTmp.restrictedVisualizations = [].concat(oData.appSearch.originalRestrictedVisualizations);

            oData.appSearch = oInitialDataTmp;

            this.getModel().setData(oData);
        },

        /**
         * Executes the navigation from one view to another view.
         *
         * @param {string} [sTarget] Target view which is navigated to.
         * @since 1.113.0
         * @returns {Promise<undefined>} Resolves with <code>undefined</code>.
         * @private
         */
        navigate: function (sTarget) {
            var oModel = this.getModel();

            oModel.setProperty("/activeNavigationTarget", sTarget);

            if (sTarget === oNavigationTargets.appSearchTiles || sTarget === oNavigationTargets.appSearchCards) {

                oModel.setProperty("/appSearch/originalVisualizations/tiles", []);
                oModel.setProperty("/appSearch/originalVisualizations/cards", []);

                oModel.setProperty("/appSearch/visualizations/tiles", []);
                oModel.setProperty("/appSearch/visualizations/cards", []);

                this._bLoading = false;

                this.queryVisualizations(0);

                return this.getNavContainer().then(function (oNavContainer) {
                    oNavContainer.to(this.oContentFinderAppSearchPage);
                }.bind(this));
            }

            return this.getNavContainer().then(function (oNavContainer) {
                oNavContainer.to(this.oContentFinderWidgetGalleryPage);
            }.bind(this));
        },

        /**
         * Initializes the content finder model.
         *
         * It is also called again after closing the dialog.
         *
         * @since 1.113.0
         * @private
         */
        _initializeModel: function () {
            this.getModel().setData(deepExtend({}, oInitialData));
        },

        /**
         * @typedef preparedTile
         * @property {string} id The vizId.
         * @property {string} appId The appId.
         * @property {string} icon The icon src.
         * @property {string} info The info string.
         * @property {string} launchUrl The launch url for the tile.
         * @property {string} subtitle The subtitle.
         * @property {string} title The title.
         * @property {string} type The type.
         * @property {string} dataHelpId The data-help-id for the assistant.
         * @property {object} vizData The whole vizData object.
         * @property {boolean} selected flag.
         * @property {boolean} added added flag. True if the visualization was already added to the cell.
         */

        /**
         * Prepares tiles from the visualizationData and enriches them for the appBoxes.
         *
         * @param {array} aVisualizationData The visualizationData from the consumer
         * @returns {array<preparedTile>} The prepared and filtered tiles
         * @since 1.113.0
         * @private
         */
        _prepareTiles: function (aVisualizationData) {
            var aTilesData = aVisualizationData.filter(function (tile) {
                return [
                    "sap.ushell.StaticAppLauncher",
                    "sap.ushell.DynamicAppLauncher"
                ].indexOf(tile.type) > -1;
            });

            return aTilesData.map(function (oTile) {
                if (!oTile.descriptor || !oTile.descriptor.value) {
                    Log.error("No descriptor available. Cannot load this tile!", null, this.logComponent);
                    return;
                }

                var oTileSapApp = oTile.descriptor.value["sap.app"];
                var oTileSapFiori = oTile.descriptor.value["sap.fiori"];
                var sAppID = "";

                if (oTileSapFiori) {
                    sAppID = oTileSapFiori.registrationIds[0];
                } else if (oTileSapApp && oTileSapApp.hasOwnProperty("id")) {
                    sAppID = oTileSapApp.id;
                }

                return {
                    id: oTile.id,
                    appId: sAppID,
                    icon: ObjectPath.get("icons.icon", oTile.descriptor.value["sap.ui"]) || "",
                    info: oTileSapApp && oTileSapApp.info || "",
                    launchUrl: oTile.descriptor.value && oTile.descriptor.value["sap.flp"] && oTile.descriptor.value["sap.flp"].target || "",
                    subtitle: oTileSapApp && oTileSapApp.subTitle || "",
                    title: oTileSapApp && oTileSapApp.title || "",
                    type: oTile.type,
                    dataHelpId: oTile.id,
                    vizData: oTile,
                    selected: false,
                    added: false
                };
            }.bind(this));
        },

        /**
         * @typedef preparedCard
         * @property {string} id The vizId.
         * @property {string} appId The appId.
         * @property {string} icon The icon src.
         * @property {string} info The info string.
         * @property {string} subtitle The subtitle.
         * @property {string} title The title.
         * @property {string} type The type.
         * @property {object} manifest The card manifest (descriptor).
         * @property {string} dataHelpId The data-help-id for the assistant.
         * @property {object} vizData The whole vizData object.
         */

        /**
         * Prepares cards from the visualizationData and enriches them for the appBoxes.
         *
         * @param {array} aVisualizationData The visualizationData from the consumer
         * @returns {array<preparedCard>} The prepared cards
         * @since 1.113.0
         * @private
         */
        _prepareCards: function (aVisualizationData) {
            var aCardsData = aVisualizationData.filter(function (oViz) {
                return oViz.type === "sap.card";
            });

            return aCardsData.map(function (oCard) {
                if (!oCard.descriptor || !oCard.descriptor.value) {
                    Log.error("No descriptor available. Cannot load this card!", null, this.logComponent);
                    return;
                }

                var oCardSapApp = oCard.descriptor.value["sap.app"];
                var sAppID = oCardSapApp && oCardSapApp.id || "";

                return {
                    id: oCard.id,
                    appId: sAppID,
                    icon: ObjectPath.get("icons.icon", oCard.descriptor.value["sap.ui"]) || "",
                    info: oCardSapApp && oCardSapApp.info || "",
                    subtitle: oCardSapApp && oCardSapApp.subTitle || "",
                    title: oCardSapApp && oCardSapApp.title || "",
                    type: oCard.type,
                    manifest: oCard.descriptor.value,
                    dataHelpId: oCard.id,
                    vizData: oCard
                };
            }.bind(this));
        },

        /**
         * Updates the added flag of the currently available visualizations.
         *
         * @since 1.113.0
         * @private
         */
        _updateVisualizationsRestricted: function () {
            var oModel = this.getModel();
            var aRestrictedVisualizations = oModel.getProperty("/appSearch/restrictedVisualizations");
            var aTiles = oModel.getProperty("/appSearch/visualizations/tiles");

            var aPreparedTiles = aTiles.map(function (oTile) {
                oTile.added = aRestrictedVisualizations.includes(oTile.id);
                return oTile;
            });

            oModel.setProperty("/appSearch/visualizations/tiles", aPreparedTiles);

        },

        /**
         * Once the ContentFinder is closed, all the component registered events need to be detached
         *
         * @since 1.113.0
         * @private
         */
        _unregisterEvents: function () {
            this.aRegisteredEvents.forEach(function (oRegisteredEvent) {
                var sEventId = oRegisteredEvent.id;
                var fnFunction = oRegisteredEvent.callback;
                var oListener = oRegisteredEvent.listener;
                this.detachEvent(sEventId, fnFunction, oListener);
            }.bind(this));

            this.aRegisteredEvents = [];
        }
    });
});
