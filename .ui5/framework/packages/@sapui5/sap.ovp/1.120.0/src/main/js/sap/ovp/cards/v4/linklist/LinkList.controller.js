/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ovp/cards/generic/base/linklist/BaseLinklist.controller",
    "sap/ovp/cards/OVPCardAsAPIUtils",
    "sap/ovp/cards/Filterhelper"
], function (
    BaseLinklistController,
    OVPCardAsAPIUtils,
    Filterhelper
) {
    "use strict";

    return BaseLinklistController.extend("sap.ovp.cards.v4.linklist.LinkList", {
        onInit: function () {
            //The base controller lifecycle methods are not called by default, so they have to be called
            //Take reference from function mixinControllerDefinition in sap/ui/core/mvc/Controller.js
            BaseLinklistController.prototype.onInit.apply(this, arguments);
        },

        onAfterRendering: function () {
            BaseLinklistController.prototype.onAfterRendering.apply(this, arguments);
            if (!OVPCardAsAPIUtils.checkIfAPIIsUsed(this)) {
                var oCardPropertiesModel = this.getCardPropertiesModel();
                var cardmanifestModel = this.getOwnerComponent().getModel("ui").getData().cards;
                var relfilters = [];
                var sEntityType = this.getEntitySet() && this.getEntitySet()["$Type"];
                var oContext = sEntityType && this.getMetaModel().getContext("/" + sEntityType);
                if (oContext) {
                    var entityType = oContext.getObject();
                    this.selectionVaraintFilter = Filterhelper.getSelectionVariantFilters(
                        cardmanifestModel,
                        oCardPropertiesModel,
                        this.getEntityType()
                    );
                }
                var oMainComponent = this.oCardComponentData.mainComponent;
                if (oMainComponent.getGlobalFilter()) {
                    relfilters = Filterhelper._getEntityRelevantFilters(
                        entityType,
                        oMainComponent.oGlobalFilter.getFilters()
                    );
                }
                if (oMainComponent.getMacroFilterBar()) {
                    var aFilters = oMainComponent.aFilters;
                    relfilters = Filterhelper._getEntityRelevantFilters(entityType, aFilters);
                }
                relfilters = Filterhelper.mergeFilters(relfilters, this.selectionVaraintFilter, oCardPropertiesModel);
                if (this.getCardItemsBinding()) {
                    this.getCardItemsBinding().filter(relfilters);
                }
                if (this.getKPIBinding()) {
                    this.getKPIBinding().filter(relfilters);
                }
            }
        }
    });
});
