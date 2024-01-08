// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview The SupportTicket adapter for the local platform.
 *
 * @version 1.120.1
 */
sap.ui.define([
], function () {
    "use strict";

    var SupportTicketAdapter = function (oSystem, sParameter, oAdapterConfiguration) {
        this.createTicket = function (oSupportObject) {
            var sTicketId = "1234567";
            return Promise.resolve(sTicketId);
        };
    };

    return SupportTicketAdapter;
});
