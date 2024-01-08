// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Defines the interface for extensions in the FloatingContainer ShellArea.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/Container"
], function (
    Container
) {
    "use strict";

    /**
     * @alias sap.ushell.services.Extension.FloatingContainer
     * @class
     * @classdesc The FloatingContainer.
     * To be instantiated by {@link sap.ushell.services.Extension}.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     *
     * @hideconstructor
     *
     * @since 1.120.0
     * @experimental since 1.120.0
     * @private
     * @ui5-restricted
     */
    class FloatingContainer {
        #renderer = Container.getRendererInternal();
        #eventDelegate = null;

        /**
         * Sets the content of the FloatingContainer.
         * @param {sap.ui.core.Control} control The actual content of the extension.
         * @param {string} dragSelector CSS selector describing the drag handle to enable drag and drop.
         * @returns {sap.ushell.services.Extension.FloatingContainer} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        setContent (control, dragSelector) {
            this.#renderer.setFloatingContainerContent(control);
            this.#eventDelegate = {
                onAfterRendering: () => {
                    this.#renderer.setFloatingContainerDragSelector(dragSelector);
                }
            };
            control.addEventDelegate(this.#eventDelegate, this);
            return this;
        }

        /**
         * @returns {sap.ushell.services.Extension.FloatingContainer} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        show () {
            this.#renderer.setFloatingContainerVisibility(true);
            return this;
        }

        /**
         * @returns {sap.ushell.services.Extension.FloatingContainer} this to allow method chaining.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        hide () {
            this.#renderer.setFloatingContainerVisibility(false);
            return this;
        }

        /**
         * @returns {Promise<boolean>} Whether the floating container is currently in <code>docked</code> state.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        async isDocked () {
            const sFloatingContainerState = this.#renderer.getFloatingContainerState() || "";
            return sFloatingContainerState.startsWith("docked");
        }

        /**
         * @returns {Promise<boolean>} Whether the floating container is currently visible.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        async isVisible () {
            return this.#renderer.getFloatingContainerVisiblity();
        }
    }

    return FloatingContainer;
});
