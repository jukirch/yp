// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @file AppSearch controller for AppSearch view
 * @version 1.120.1
 */
sap.ui.define([
    "./ContentFinderDialog.controller",
    "../model/formatter",
    "sap/base/Log",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (
    ContentFinderController,
    formatter,
    Log,
    Filter,
    FilterOperator
) {
    "use strict";

    /**
     * Controller of the AppSearch view.
     *
     * @param {string} sId Controller id
     * @param {object} oParams Controller parameters
     * @class
     * @assigns sap.ui.core.mvc.Controller
     * @private
     * @since 1.113.0
     * @alias sap.ushell.components.contentFinder.controller.AppSearch
     */
    return ContentFinderController.extend("sap.ushell.components.contentFinder.controller.AppSearch", {
        /**
         * The contentFinder formatters.
         *
         * @since 1.113.0
         * @private
         */
        formatter: formatter,

        /**
         * Enum for available filters.
         *
         * @since 1.111.0
         * @private
         */
        filters: {
            search: "searchFilter",
            select: "selectFilter"
        },

        /**
         * The init function called after the view is initialized.
         *
         * @since 1.113.0
         * @private
         */
        onInit: function () {
            this._oActiveFilters = {};
            this.oModel = this.getOwnerComponent().getModel();
            this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

            this.getOwnerComponent().getNavContainer().then(function (oNavContainer) {
                // Attach to the navigate-event to the NavContainer only for the targets relevant to the AppSearch
                oNavContainer.attachNavigate(function () {
                    var sActiveNavigationTarget = this.oModel.getProperty("/activeNavigationTarget");
                    if (sActiveNavigationTarget === this.oModel.getProperty("/navigationTargets/appSearchTiles")
                        || sActiveNavigationTarget === this.oModel.getProperty("/navigationTargets/appSearchCards")
                    ) {
                        this._resetFilters();
                    }
                }.bind(this));
            }.bind(this));
        },

        /**
         * Triggered when the search is executed. Fires the query to get visualizations with the search term.
         *
         * @since 1.115.0
         * @private
         * @param {sap.base.Event} oEvent The 'search' event.
         */
        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query") || "";
            this.oModel.setProperty("/appSearch/originalVisualizations/tiles", []);
            this.oModel.setProperty("/appSearch/originalVisualizations/cards", []);

            this.oModel.setProperty("/appSearch/visualizations/tiles", []);
            this.oModel.setProperty("/appSearch/visualizations/cards", []);
            this.getOwnerComponent().queryVisualizations(0, sQuery);
        },

        /**
         * Event handler which is called when the App Search is triggered.
         *
         * @param {sap.ui.base.Event} oEvent SearchBox Search Event Object.
         * @since 1.113.0
         * @private
         */
        onAppSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");

            if (sQuery) {
                this._oActiveFilters[this.filters.search] = new Filter({
                    filters: [
                        new Filter("appId", FilterOperator.Contains, sQuery),
                        new Filter("title", FilterOperator.Contains, sQuery),
                        new Filter("subtitle", FilterOperator.Contains, sQuery),
                        new Filter("info", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                });
                this._applyFilters();
            } else {
                this._resetFilters([this.filters.search]);
            }
        },

        /**
         * Event handler which is called when an app box was selected.
         *
         * Updates selection related model data which shows the count of the selection in the button.
         * The selected items are added with a handler in the dialog.
         *
         * @since 1.113.0
         * @private
         */
        onAppBoxSelected: function () {
            this.oModel.setProperty("/appSearch/selectedAppCount", this.getOwnerComponent().getSelectedAppBoxes(false).length);
        },

        /**
         * Event handler which is called when an app box was selected
         * and the dialog closes.
         *
         * This is used to add a single app box and close the dialog afterwards
         * (e.g. for Cards).
         *
         * @param {sap.ui.base.Event} oEvent The Event object.
         * @since 1.113.0
         * @private
         */
        onAppBoxSelectedAndClose: function (oEvent) {
            oEvent.getParameter("listItem").setSelected(true);
            this.getOwnerComponent().addVisualizations();
            this.getOwnerComponent().getRootControl().byId("contentFinderDialog").close();
        },

        /**
         * Fired when a data update on the list was started. Queries the new list of visualizations.
         *
         * @param {sap.base.Event} oEvent The 'updateStarted' event.
         * @since 1.115.0
         * @private
         */
        onUpdateStarted: function (oEvent) {
            if (oEvent.getParameter("reason") === "Growing") {
                var sSearchTerm = this.oModel.getProperty("/appSearch/searchTerm");
                var iSkip = oEvent.getParameter("actual");
                this.getOwnerComponent().queryVisualizations(iSkip, sSearchTerm);
            }
        },

        /**
         * EventHandler which is called when the "show selected" button is pressed
         * to show only selected tiles/cards.
         *
         * The button can stay "pressed" after being pressed. Another press removes
         * this state which resets the filters.
         *
         * @param {sap.ui.base.Event} oEvent Button Press Event object.
         * @since 1.113.0
         * @private
         */
        onShowSelectedPressed: function (oEvent) {
            if (oEvent.getParameter("pressed")) {
                // In case the button is pressed, clear the search
                this.byId("appSearchField").clear();
                this._oActiveFilters[this.filters.select] = new Filter("selected", FilterOperator.EQ, true);
                this._applyFilters();
            } else {
                // Clear filters and the search
                this._resetFilters([this.filters.search, this.filters.select]);
                this.byId("appSearchField").clear();
            }
        },

        /**
         * Formats the accessibility description for the custom list item. This will be part of the string read out by the screen reader.
         *
         * @param {string} sTitle The app title.
         * @param {string} sSubtitle The app subtitle.
         * @param {boolean} bAdded Flag indicating if the app has already been added to the cell.
         * @since 1.115.0
         * @returns {string} The description.
         */
        formatAppBoxAccDescription: function (sTitle, sSubtitle, bAdded) {
            var aDescriptions = [];

            if (sTitle) { aDescriptions.push(sTitle); }
            if (sSubtitle) { aDescriptions.push(sSubtitle); }
            if (bAdded) { aDescriptions.push(this.oResourceBundle.getText("ContentFinder.AppSearch.Message.AlreadyUsed")); }

            return aDescriptions.join(" . ");
        },

        /**
         * Apply the filter for the GridList.
         *
         * @since 1.113.0
         * @private
         */
        _applyFilters: function () {
            var oGridList = this._getGridList();
            var oBinding = oGridList.getBinding("items");

            // Update list binding
            oBinding.filter(new Filter({
                filters: Object.values(this._oActiveFilters),
                and: true
            }), "Control");

            this.oModel.setProperty("/appSearch/filteredAppCount", oBinding.getLength());
        },

        /**
         * Resets the provided filters.
         *
         * In case no filters are provided all available filters are reset instead.
         *
         * @param {string[]} [aFilters] The filters which need to be reset. By default, all filters are reset
         * @since 1.113.0
         * @private
         */
        _resetFilters: function (aFilters) {
            if (!aFilters) {
                aFilters = Object.keys(this._oActiveFilters);
            }

            aFilters.forEach(function (filter) {
                if (!Object.values(this.filters).includes(filter)) {
                    Log.error("Invalid filter provided. Skipping.", null, this.getOwnerComponent().logComponent);
                    return;
                }
                delete this._oActiveFilters[filter];
            }.bind(this));
            this._applyFilters();
        },

        /**
         * Returns the GridList for the current widget type based on the active navigation target.
         *
         * In case the navigation is not valid or the GridList is not available, <code>null</code> is returned and an error is logged.
         *
         * @returns {sap.f.GridList|null} Returns the GridList or <code>null</code> and logs an error if not available.
         * @since 1.113.0
         * @private
         */
        _getGridList: function () {
            var sNavigationTargetAppSearchTiles = this.oModel.getProperty("/navigationTargets/appSearchTiles");
            var sNavigationTargetAppSearchCards = this.oModel.getProperty("/navigationTargets/appSearchCards");
            var sActiveNavigationTarget = this.oModel.getProperty("/activeNavigationTarget");

            if (sActiveNavigationTarget === sNavigationTargetAppSearchTiles) {
                return this.byId("tiles");
            } else if (sActiveNavigationTarget === sNavigationTargetAppSearchCards) {
                return this.byId("cards");
            }

            Log.error("Invalid navigation target provided. Could not determine GridList.", null, this.getOwnerComponent().logComponent);

            return null;
        }
    });
});
