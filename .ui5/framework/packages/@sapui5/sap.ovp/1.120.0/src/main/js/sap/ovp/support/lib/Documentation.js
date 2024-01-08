/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */
sap.ui.define([
    "sap/m/library",
    "sap/ui/VersionInfo"
], function (
    mLibrary,
    VersionInfo 
) {
    "use strict";

    var EXT_DOCU_DOMAIN = "https://ui5.sap.com/";
    var EXT_DOCU_TOPIC = "03265b0408e2432c9571d6b3feb6b1fd";

    /**
     * @returns {string} link to external documentation
     */
    function fnGetDocuURL() {
        return VersionInfo.load()
                .then(function(oVersionInfo) { 
                   var sUI5Version = oVersionInfo.version; 
                   if (sUI5Version.indexOf("-SNAPSHOT") !== -1) {
                     return EXT_DOCU_DOMAIN + "#/topic/" + EXT_DOCU_TOPIC;
                   } else {
                    return EXT_DOCU_DOMAIN + sUI5Version + "/#/topic/" + EXT_DOCU_TOPIC;
                   }
               });
    }

    /**
     * Opens the documentation
     */
    function fnOpenDocumentation() {
        fnGetDocuURL().then(function(sDocumentUrl) {
           mLibrary.URLHelper.redirect(sDocumentUrl, true);
        });
    }

    return {
        getDocuURL: fnGetDocuURL,
        openDocumentation: fnOpenDocumentation
    };
});
