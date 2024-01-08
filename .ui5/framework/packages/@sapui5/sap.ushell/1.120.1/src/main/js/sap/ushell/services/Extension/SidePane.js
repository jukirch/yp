// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Defines the interface for extensions in the SidePane ShellArea.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "./Item",
    "sap/ushell/Container",
    "sap/ushell/utils"
], function (
    ExtensionItem,
    Container,
    ushellUtils
) {
    "use strict";

    /**
     * @alias sap.ushell.services.Extension.SidePane
     * @class
     * @classdesc The side pane extension point is positioned next the launchpad content.
     * To be instantiated by {@link sap.ushell.services.Extension}.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     *
     * @hideconstructor
     *
     * @since 1.120.0
     * @experimental since 1.120.0
     * @public
     */
    class SidePane {
        #renderer = Container.getRendererInternal();

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
            const aArgs = [
                launchpadState,
                visible
            ];

            await ushellUtils.promisify(this.#renderer.setLeftPaneVisibility(...aArgs));
        };

        /**
         * Creates an item in the side pane.
         * @param {object} controlProperties The properties that will be passed to the created control.
         * @param {object} [parameters] Additional parameters.
         * @param {string} [parameters.controlType=sap.m.Button] Defines the <code>controlType</code>.
         * @returns {Promise<sap.ushell.services.Extension.Item>} The newly created item.
         *
         * @since 1.120.0
         * @public
         */
        async createItem (controlProperties, parameters) {
            const aCreateArgs = [{
                controlType: parameters.controlType,
                oControlProperties: controlProperties,
                bIsVisible: false,
                bCurrentState: undefined,
                aStates: undefined
            }];
            const fnCreate = this.#renderer.addSidePaneContent.bind(this.#renderer);
            const fnShow = this.#renderer.showLeftPaneContent.bind(this.#renderer);
            const fnHide = this.#renderer.hideLeftPaneContent.bind(this.#renderer);

            const oControl = await ushellUtils.promisify(fnCreate(...aCreateArgs));

            async function visibilityHandler (visible, currentState, state) {
                const states = state ? [state] : undefined;
                if (visible) {
                    await ushellUtils.promisify(fnShow(oControl.getId(), currentState, states));
                    return;
                }
                await ushellUtils.promisify(fnHide(oControl.getId(), currentState, states));
            }

            return new ExtensionItem(oControl, visibilityHandler);
        }

        /**
         * @param {sap.ushell.renderer.Renderer.LaunchpadState} launchpadState Whether the area should be visible this or not
         * @param {boolean} visible Whether the side pane should be visible or not
         *
         * @since 1.120.0
         * @private
         */
        setVisibilityForLaunchpadState (launchpadState, visible) {
            this.#visibilityHandler(visible, false, launchpadState);
        }

        /**
         * Shows the side pane for all applications.
         * Does not change the visibility of the side pane for the launchpad "home".
         * @returns {sap.ushell.services.Extension.SidePane} this to allow method chaining.
         *
         * @since 1.120.0
         * @public
         */
        showForAllApps () {
            this.setVisibilityForLaunchpadState("app", true);
            return this;
        }

        /**
         * Shows the side pane for all applications.
         * Does not change the visibility of the side pane for the launchpad "home".
         * @returns {sap.ushell.services.Extension.SidePane} this to allow method chaining.
         *
         * @since 1.120.0
         * @public
         */
        hideForAllApps () {
            this.setVisibilityForLaunchpadState("app", false);
            return this;
        }

        /**
         * Shows the side pane for launchpad "home".
         * Does not change the visibility of the side pane within applications.
         * @returns {sap.ushell.services.Extension.SidePane} this to allow method chaining.
         *
         * @since 1.120.0
         * @public
         */
        showOnHome () {
            this.setVisibilityForLaunchpadState("home", true);
            return this;
        }

        /**
         * Hides the area for launchpad "home".
         * Does not change the visibility of the area within applications.
         * @returns {sap.ushell.services.Extension.SidePane} this to allow method chaining.
         *
         * @since 1.120.0
         * @public
         */
        hideOnHome () {
            this.setVisibilityForLaunchpadState("home", false);
            return this;
        }
    }

    return SidePane;
});
