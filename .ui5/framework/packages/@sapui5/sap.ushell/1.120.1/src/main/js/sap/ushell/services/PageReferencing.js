// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview This module deals with page related referencing and dereferencing.
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/services/_PageReferencing/PageReferencer"
], function (PageReferencer) {
    "use strict";

    /**
     * @alias sap.ushell.services.PageReferencing
     * @class
     * @classdesc The Unified Shell's PageReferencing service.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("PageReferencing")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * @hideconstructor
     *
     * @since 1.68.0
     * @experimental Since 1.68.0
     * @private
     */
    function PageReferencing () { }

    /**
     * Create reference page based on the page layout
     *
     * @param {object} pageInfo Data are given by the user when creating the page.
     *
     * @returns {object} Reference page
     *
     * @experimental Since 1.68.0
     * @protected
     */
    PageReferencing.prototype.createReferencePage = function (pageInfo) {
        return PageReferencer.createReferencePage(pageInfo);
    };

    PageReferencing.hasNoAdapter = true;

    return PageReferencing;
});
