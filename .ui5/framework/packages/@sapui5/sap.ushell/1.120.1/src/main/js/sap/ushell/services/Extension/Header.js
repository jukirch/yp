// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Defines the interface for extensions in the ShellHeader ShellArea.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ushell/Config",
    "sap/ushell/Container",
    "sap/ushell/utils"
], function (
    Log,
    Config,
    Container,
    ushellUtils
) {
    "use strict";

    /**
     * @alias sap.ushell.services.Extension.Header
     * @class
     * @classdesc Extension point of the Header.
     * To be instantiated by {@link sap.ushell.services.Extension}.
     *
     * @hideconstructor
     *
     * @since 1.120.0
     * @experimental since 1.120.0
     * @private
     * @ui5-restricted
     */
    class Header {
        #renderer = Container.getRendererInternal();
        #visibilityMap = {};

        /**
         * @param {boolean} visible
         *   Whether the item shall be visible or not.
         * @param {boolean} currentState
         *   Whether the new visibility shall be applied only to the 'currentState'.
         * @param {sap.ushell.renderer.Renderer.LaunchpadState} launchpadState
         *   To which launchpad state the new visibility shall be applied.
         *   Is only Considered if <code>currentState</code> is <code>false</code>.
         * @returns {Promise} Resolves after visibility was changed.
         */
        #visibilityHandler = async (visible, currentState, launchpadState) => {
            const states = launchpadState ? [launchpadState] : undefined;
            await ushellUtils.promisify(this.#renderer.setHeaderVisibility(visible, currentState, states));
        };

        /**
         * Overwrites the title in the header
         * @param {string} newTitle The new title
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        setTitle (newTitle) {
            this.#renderer.setHeaderTitle(newTitle);
            return this;
        }

        /**
         * @param {boolean} visible Whether the item should be visible or not
         *
         * @since 1.120.0
         * @private
         */
        setVisibilityForCurrentApp (visible) {
            if (!visible && this.#visibilityMap[this.#getCurrentState()]) {
                Log.warning("The header was set to 'visible' for the current launchpad state and cannot be turned off for this app");
            }
            this.#visibilityHandler(visible, true, undefined);
        }

        /**
         * @param {sap.ushell.renderer.Renderer.LaunchpadState} launchpadState The launchpad state to change
         * @param {boolean} visible Whether the item should be visible or not
         *
         * @since 1.120.0
         * @private
         */
        setVisibilityForLaunchpadState (launchpadState, visible) {
            this.#visibilityMap[launchpadState] = visible;
            this.#visibilityHandler(visible, false, launchpadState);
        }

        /**
         * Shows the item for the current application.
         * The item will be hidden after the user navigates away from this application.
         * The item will <b>not<b> be added again if the user navigates back to the application.
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        showForCurrentApp () {
            this.setVisibilityForCurrentApp(true);
            return this;
        }

        /**
         * Hides the item for the current application.
         * Note: The item will not be hidden if it was set visible for all apps {@link #showForAllApps}
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        hideForCurrentApp () {
            if (this.#visibilityMap[this.#getCurrentState()]) {
                Log.warning("The extension was set visible for the current launchpad state and cannot be turned off for this app");
            }
            this.setVisibilityForCurrentApp(false);
            return this;
        }

        /**
         * Shows the item for all applications.
         * Does not change the visibility of the item for the launchpad "home".
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        showForAllApps () {
            this.setVisibilityForLaunchpadState("app", true);
            return this;
        }

        /**
         * Shows the item for all applications.
         * Does not change the visibility of the item for the launchpad "home".
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        hideForAllApps () {
            this.setVisibilityForLaunchpadState("app", false);
            return this;
        }

        /**
         * Shows the item for launchpad "home".
         * Does not change the visibility of the item within applications.
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        showOnHome () {
            this.setVisibilityForLaunchpadState("home", true);
            return this;
        }

        /**
         * Hides the item for launchpad "home".
         * Does not change the visibility of the item within applications.
         * @returns {sap.ushell.services.Extension.Header} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        hideOnHome () {
            this.setVisibilityForLaunchpadState("home", false);
            return this;
        }

        /**
         * @returns {sap.ushell.renderer.Renderer.LaunchpadState} The current state.
         *
         * @since 1.120.0
         * @private
         */
        #getCurrentState () {
            const sCurrentState = Config.last("/core/shell/model/currentState/stateName");
            return sCurrentState;
        }
    }

    return Header;
});
