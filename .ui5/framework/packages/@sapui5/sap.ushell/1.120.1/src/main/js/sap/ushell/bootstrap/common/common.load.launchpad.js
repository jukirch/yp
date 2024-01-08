// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
/*
 * This module provides a function that actually initiates loading of the
 * launchpad content.
 */
sap.ui.define([

], function (

) {
    "use strict";

    return loadLaunchpadContent;

    function loadLaunchpadContent (sDomId) {

        //Lazy loading of iconfonts and AppConfiguration (avoid packing this module into cdm.js bundle)
        sap.ui.require(["sap/ushell/iconfonts", "sap/ushell/services/AppConfiguration", "sap/ushell/Container"], function (IconFonts, Configuration, Container) {
            // Create the default renderer asynchronously and place its UI5 control into the canvas div replacing the contents
            Container.createRendererInternal(null).then(
                function (oContent) {
                    oContent.placeAt(sDomId || "canvas", "only");
                }
            );
            IconFonts.registerFiori2IconFont();
        });
    }

});
