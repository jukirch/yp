// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/*
 * CDM Bootstrap script for LOCAL TESTING only.
 *
 * In a development environment, this script serves as the root of the CDM bootstrap.
 * And it will load all CDM bootstrap modules and the SAPUI5 modules each as a single requested resource (no preloads and no bundling).
 */
(function () {
    "use strict";

    // extract base URL from bootstrap script tag
    var sBaseUrl,
        oBootScript = document.querySelector("script[src$=\"sap/ushell/bootstrap/cdm.js\"]");

    if (!oBootScript) {
        throw new Error("cdm.js: could not identify cdm bootstrap script tag!");
    }

    sBaseUrl = oBootScript.src.match(/(.*\/)sap\/ushell\/bootstrap\/cdm\.js$/i)[1];

    function loadScripts (aUrls, fnCallback) {
        var iPending = aUrls.length,
            iErrors = 0;

        function listener (oEvent) {
            iPending--;
            if (oEvent.type === "error") {
                iErrors++;
            }
            oEvent.target.removeEventListener("load", listener);
            oEvent.target.removeEventListener("error", listener);
            if (iPending === 0 && iErrors === 0 && fnCallback) {
                fnCallback();
            }
        }

        for (var i = 0; i < aUrls.length; i++) {
            var script = document.createElement("script");
            script.addEventListener("load", listener);
            script.addEventListener("error", listener);
            script.src = sBaseUrl + aUrls[i];
            document.head.appendChild(script);
        }
    }

    // cascade 1: the loader
    loadScripts([
        "ui5loader-dbg.js"
    ], function () {
        // cascade 2: the loader configuration script in ushell
        loadScripts([
            "sap/ushell/bootstrap/ui5loader-config.js"
        ], function () {
            // cascade 3: the loader configuration script from ui5
            loadScripts([
                "ui5loader-autoconfig-dbg.js"
            ], function () {
                // cascade 4: the cdm-def-dev (must be loaded before the core because it needs to set the core configuration)
                sap.ui.require([
                    "sap/ushell/bootstrap/cdm/cdm-def-dev"
                ], function (/*cdmDefDev*/) {
                    // cascade 5: load core and finally boot the core
                    sap.ui.require([
                        "sap/ui/core/Core"
                    ], function (core) {
                        core.boot();
                    });
                });
            });
        });
    });
}());
