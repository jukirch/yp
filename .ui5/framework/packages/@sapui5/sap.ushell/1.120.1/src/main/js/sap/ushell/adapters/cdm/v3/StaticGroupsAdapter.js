// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/**
 * @fileOverview The Unified Shell's LaunchPageAdapter for the
 *               'CDM' platform - Version 3 (V3)
 *
 * @version 1.120.1
 */
sap.ui.define([
    "sap/ushell/adapters/cdm/v3/AdapterBase"
], function (AdapterBase) {
    "use strict";

    function StaticGroupsAdapter (oSystem, sParamterm, oAdapterConfiguration) {
        AdapterBase.call(this, oSystem, sParamterm, oAdapterConfiguration);
    }

    StaticGroupsAdapter.prototype = AdapterBase.prototype;

    StaticGroupsAdapter.prototype._addDefaultGroup = function (aGroups, oSite) {
        return aGroups;
    };

    StaticGroupsAdapter.prototype._getSiteData = function () {
        return Promise.resolve(this.oAdapterConfiguration.config);
    };

    return StaticGroupsAdapter;
});
