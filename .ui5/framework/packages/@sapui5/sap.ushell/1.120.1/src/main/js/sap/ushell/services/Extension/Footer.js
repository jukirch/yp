// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Defines the interface for extensions in the Footer ShellArea.
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
     * @alias sap.ushell.services.Extension.Footer
     * @class
     * @classdesc The footer extension point is positioned below the launchpad content.
     * To be instantiated by {@link sap.ushell.services.Extension}.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     *
     * @hideconstructor
     *
     * @since 1.120.0
     * @experimental since 1.120.0
     * @public
     */
    class Footer {
        #renderer = Container.getRendererInternal();
        #control = null;

        constructor (control) {
            this.#control = control;
        }

        /**
         * Returns the related control instance.
         * @returns {Promise<sap.ui.core.Control>} The control.
         *
         * @since 1.120.0
         * @private
         * @ui5-restricted
         */
        async getControl () {
            return this.#control;
        }

        /**
         * Destroys the footer.
         * @returns {Promise} Resolves once the footer was destroyed.
         *
         * @since 1.120.0
         * @public
         */
        async destroy () {
            this.#renderer.removeFooterById(this.#control.getId());
        }
    }

    return Footer;
});
