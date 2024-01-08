// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview The Search adapter for the demo platform.
 *
 * @version 1.120.1
 */
sap.ui.define([
], function () {
    "use strict";

    var SearchAdapter = function (oSystem, sParameter, oAdapterConfiguration) {
        this.isSearchAvailable = function () {
            return Promise.resolve(true);
        };
    };


	return SearchAdapter;
});
