/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/table/BaseTable.controller",
    "sap/ovp/filter/FilterUtils",
    "sap/ui/core/Core"
], function (
    BaseTableController,
    FilterUtils,
    Core
) {
    "use strict";

    return BaseTableController.extend("sap.ovp.cards.table.Table", {
        onInit: function () {
            //The base controller lifecycle methods are not called by default, so they have to be called
            //Take reference from function mixinControllerDefinition in sap/ui/core/mvc/Controller.js
            BaseTableController.prototype.onInit.apply(this, arguments);
            var that = this;
            this.eventhandler = function (sChannelId, sEventName, aFilters) {
                FilterUtils.applyFiltersToV2Card(aFilters, that);
            };
            this.GloabalEventBus = Core.getEventBus();
            if (this.oMainComponent && this.oMainComponent.isMacroFilterBar) {
                this.GloabalEventBus.subscribe("OVPGlobalfilter", "OVPGlobalFilterSeacrhfired", that.eventhandler);
            }
        },
        onAfterRendering: function () {
            BaseTableController.prototype.onAfterRendering.apply(this, arguments);
        }
    });
});
