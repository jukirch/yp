// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/appRuntime/ui5/AppCommunicationMgr"
], function (AppCommunicationMgr) {
    "use strict";

    function AppRuntimeService () {
        this.sendMessageToOuterShell = function (sMessageId, oParams, sRequestId, nTimeout, oDefaultVal) {
            return AppCommunicationMgr.sendMessageToOuterShell(sMessageId, oParams, sRequestId, nTimeout, oDefaultVal);
        };
    }

    return new AppRuntimeService();
});
