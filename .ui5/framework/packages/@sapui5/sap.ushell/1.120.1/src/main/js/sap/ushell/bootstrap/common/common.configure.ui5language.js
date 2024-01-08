// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/base/util/ObjectPath",
    "sap/ui/core/Configuration"
], function (ObjectPath, Configuration) {
    "use strict";

    /**
     * Configures UI5 language based on the shell configuration.
     *
     * @param {object} oUshellConfig The ushell configuration.
     *
     * @private
     */
    function configureUI5Language (oUshellConfig) {
        var oUserProfileDefaults = ObjectPath.get("services.Container.adapter.config.userProfile.defaults", oUshellConfig);
        var sLanguageBcp47 = oUserProfileDefaults && oUserProfileDefaults.languageBcp47;

        // note: the sap-language query parameter must be considered by the server
        // and will change the language defaults read above
        // only consider BCP-47 language, don't set ABAP language (see BCP 2380072963)
        if (sLanguageBcp47) {
            Configuration.setLanguage(sLanguageBcp47);
        }
    }

    return configureUI5Language;
});
