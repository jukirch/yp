/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ovp/cards/AppSettingsUtils",
    "sap/ui/model/json/JSONModel",
    "sap/base/util/merge"
], function (
    Controller,
    AppSettingsUtils,
    JSONModel,
    merge
) {
    "use strict";

    return Controller.extend("sap.ovp.cards.rta.AppSettingsDialog", {
        onInit: function () {
            AppSettingsUtils.oResetButton.attachPress(this.onResetButton, this);
        },
        onAfterRendering: function () {
            this.setEnablePropertyForResetAndSaveButton(false);
            this._ovpManifestSettings = this.getView().getModel().getData();
            this._originalOVPManifestSettings = merge({}, this._ovpManifestSettings);
        },
        onResetButton: function () {
            this.setEnablePropertyForResetAndSaveButton(false);
            this._ovpManifestSettings = merge({}, this._originalOVPManifestSettings);
            var ovpManifestSettingsModel = new JSONModel(this._ovpManifestSettings);
            this.getView().setModel(ovpManifestSettingsModel);
            this.getView().getModel().refresh();
        },
        onChange: function () {
            this.setEnablePropertyForResetAndSaveButton(true);
        },
        setEnablePropertyForResetAndSaveButton: function (bEnabled) {
            AppSettingsUtils.oResetButton.setEnabled(bEnabled);
            AppSettingsUtils.oSaveButton.setEnabled(bEnabled);
        }
    });
});
