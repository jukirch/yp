// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview The URLTemplate service provides utilities when working with URL templates
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/utils",
    "sap/base/Log"
], function (
    utils,
    Log
) {
    "use strict";

    /**
     * @alias sap.ushell.services.URLTemplate
     * @class
     * @classdesc The Unified Shell's URLTemplate service.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("URLTemplate")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @since 1.94.0
     * @private
     */
    function URLTemplate () {
        this._init.apply(this, arguments);
    }

    /**
     * Private initializer.
     *
     * @param {object} adapter The URLTemplate adapter for the server.
     *
     * @since 1.94.0
     * @private
     */
    URLTemplate.prototype._init = function (adapter) {
        this.oAdapter = adapter;
    };

    /**
     * Allow the platform to perform post url template processing actions to manipulate the url before iframe is opened.
     *
     * @returns {Promise<Url>} The new URL after platform changes
     *
     * @since 1.94.0
     * @private
     */
    URLTemplate.prototype.handlePostTemplateProcessing = function (sUrl, oSiteAppSection, bForNewIframe) {
        if (this.oAdapter && this.oAdapter.handlePostTemplateProcessing) {
            return this.oAdapter.handlePostTemplateProcessing(sUrl, oSiteAppSection, bForNewIframe);
        }
        return Promise.resolve(sUrl);
    };

    // Return URLTemplate service from this module
    URLTemplate.hasNoAdapter = false;
    URLTemplate.useConfiguredAdapterOnly = true;
    return URLTemplate;
});
