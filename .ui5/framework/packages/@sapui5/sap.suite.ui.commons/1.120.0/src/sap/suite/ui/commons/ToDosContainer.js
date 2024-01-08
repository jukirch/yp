sap.ui.define([
    "sap/suite/ui/commons/BaseContainer",
    "sap/base/Log"
], function (
    BaseContainer,
    Log
) {
    "use strict";

    const ToDosContainer = BaseContainer.extend("sap.suite.ui.commons.ToDosContainer", {
        renderer: {
            apiVersion: 2
        }
    });

    /**
     * Init lifecycle method
     *
     */
    ToDosContainer.prototype.init = function () {
        //Update Container Title
        this.setTitle(this.getResourceBundle().getText("toDosTitle"));
        this.addStyleClass("sapUiToDosContainer");
        this._isAuthCheckRequired = true;

        BaseContainer.prototype.init.apply(this, arguments);
    };

    /**
     * onBeforeRendering lifecycle method
     * Performs auth check for the inner panels and load them
     *
     * @async
     */
    ToDosContainer.prototype.onBeforeRendering = async function () {
        BaseContainer.prototype.onBeforeRendering.apply(this, arguments);
        this._iconTabBarControl = this.getInnerControl();

        //initiate loading of all cards after auth check
        try {
            await this.performAuthCheck();

            const panels = this.getContent();
            const unsupportedPanels = panels.filter((panel) => !panel.getSupported());

            if (unsupportedPanels.length === panels.length) {
                this._handleToDoUnauthorizedAccess();
            } else {
                // Hide IconTabBar header if only one panel is accessible
                const isOnePanelSupported = panels.length - unsupportedPanels.length === 1;
                this._iconTabBarControl?.toggleStyleClass("sapUiITBHide", isOnePanelSupported);
                await this.loadAllPanels();
            }
        } catch (error) {
            this._handleToDoUnauthorizedAccess();
        }
    };

    /**
     * Asynchronously loads all panels, ensuring the currently selected panel is loaded first.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when all panels are loaded.
     */
    ToDosContainer.prototype.loadAllPanels = async function () {
        //Sort panels so that the current panel is always loaded first
        const selectedKey = this.getSelectedKey();
        const sortedPanels = this.getContent()
            .sort((firstPanel, secondPanel) => {
                if (firstPanel.getKey() === selectedKey) { return -1; }
                if (secondPanel.getKey() === selectedKey) { return 1; }
                return 0;
            });

        for (const panel of sortedPanels) {
            if (!panel?.isLoaded?.()) {
                await panel.loadToDos();
            }
        }
    };

    /**
     * Overridden method for selection of panel in the IconTabBar.
     * Loads the selected panel and updates the header elements as well
     *
     * @async
     */
    ToDosContainer.prototype.onPanelSelect = async function () {
        BaseContainer.prototype.onPanelSelect.apply(this, arguments);

        //load panel if not loaded already
        const selectedPanel = this.getSelectedPanel();
        if (!selectedPanel.isLoaded()) {
            await selectedPanel.loadToDos();
        }

        //updates refresh information of the selected panel
        selectedPanel.updateRefreshInformation();
    };

    /**
     * Asynchronously refreshes the section by forcing all inner panels to be reloaded and then loading all panels.
     *
     * @async
     * @returns {Promise<void>} A promise that resolves when the section is successfully refreshed.
     */
    ToDosContainer.prototype.refreshData = async function () {
        //Force all inner panels to be reloaded
        this.getContent().forEach((panel) => panel.setLoaded(false));
        await this.loadAllPanels();
    };

    /**
     * Performs an authorization check for the ToDosContainer.
     * Checks if the authorization check is required and updates panel support accordingly.
     *
     * @async
     * @returns {Promise<void>} A Promise that resolves when the authorization check is completed.
     * @throws {Error} If an error occurs during the authorization check.
     */
    ToDosContainer.prototype.performAuthCheck = async function () {
        try {
            if (!this._isAuthCheckRequired) {
                return Promise.resolve();
            } else {
                const crossApplicationNavigationService = await sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
                const intents = this.getContent().map((panel) => panel.getAppIntent());
                const responses = await crossApplicationNavigationService.isNavigationSupported(intents);

                //Update panel support information
                this.getContent().forEach((panel, index) => panel.setSupported(responses[index].supported));
                this._isAuthCheckRequired = false;
            }
        } catch (oError) {
            return Promise.reject(oError);
        }
    };

    /**
     * Handles unauthorized access to the ToDosContainer by hiding all inner controls
     *
     * @param {string|Error} [error] - An optional custom error message or an Error object.
     */
    ToDosContainer.prototype._handleToDoUnauthorizedAccess = function (error) {
        //Hide all Inner Controls
        Log.error(error || "User has no access to any available panels");
        this.setVisible(false);
    };

    /**
     * Gets the selected key of the ToDosContainer.
     * If no selected key is set, it defaults to the first item.
     *
     * @returns {string} The selected key.
     */
    ToDosContainer.prototype.getSelectedKey = function () {
        //Default selected key to first item, if null
        if (!this.getProperty("selectedKey")) {
            this.setProperty("selectedKey", this._getDefaultKey());
        }

        return this.getProperty("selectedKey");
    };

    /**
     * Gets the default key for the ToDosContainer by returning the key of the first panel
     *
     * @returns {string|null} The default key if it exists, or null if there are no panels
     */
    ToDosContainer.prototype._getDefaultKey = function () {
        return this.getContent()[0]?.getKey();
    };

    return ToDosContainer;
});
