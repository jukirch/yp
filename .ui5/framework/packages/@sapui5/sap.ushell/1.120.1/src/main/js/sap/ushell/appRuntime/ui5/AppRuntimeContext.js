// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/base/assert",
    "sap/ushell/utils/UrlParsing",
    "sap/base/util/deepClone"
], function (assert, UrlParsing, deepClone) {
    "use strict";

    function AppRuntimeContext () {
        var _bIsScube = false,
            _sRemoteSystemId = "",
            _AppLifeCycleAgent;

        this.setAppLifeCycleAgent = function (AppLifeCycleAgent) {
            _AppLifeCycleAgent = AppLifeCycleAgent;
        };

        this.setIsScube = function (bIsScube) {
            _bIsScube = bIsScube;
        };

        this.getIsScube = function () {
            return _bIsScube;
        };

        this.setRemoteSystemId = function (sRemoteSystemId) {
            _sRemoteSystemId = sRemoteSystemId;
        };

        this.getRemoteSystemId = function () {
            return _sRemoteSystemId;
        };

        this.checkDataLossAndContinue = function () {
            return (_AppLifeCycleAgent ? _AppLifeCycleAgent.checkDataLossAndContinue() : true);
        };

        this.checkIntentsConversionForScube = function (aAppsIntents) {
            var that = this;

            if (!this.getIsScube() || !aAppsIntents || aAppsIntents.length === 0) {
                return Promise.resolve(aAppsIntents);
            }

            return new Promise(function (fnResolve) {
                var aAppsIntentsCopy = deepClone(aAppsIntents);
                var aIntents = [];
                var oParsedHash;

                aIntents = aAppsIntentsCopy.map(function (oApp) {
                    return {
                        target: {
                            shellHash: oApp.intent
                        }
                    };
                });

                sap.ushell.Container.getServiceAsync("Navigation").then(function (oNavService) {
                    oNavService.isNavigationSupported(aIntents, undefined, true).then(function (aIntentsSupported) {
                        for (var i = 0; i < aIntentsSupported.length; i++) {
                            if (!aIntentsSupported[i].supported) {
                                oParsedHash = UrlParsing.parseShellHash(aAppsIntentsCopy[i].intent);
                                oParsedHash.params["sap-shell-so"] = oParsedHash.semanticObject;
                                oParsedHash.params["sap-shell-action"] = oParsedHash.action;
                                oParsedHash.params["sap-remote-system"] = that.getRemoteSystemId();
                                oParsedHash.semanticObject = "Shell";
                                oParsedHash.action = "startIntent";
                                aAppsIntentsCopy[i].intent = "#" + UrlParsing.constructShellHash(oParsedHash);
                            }
                        }
                        fnResolve(aAppsIntentsCopy);
                    });
                });
            });
        };
    }

    return new AppRuntimeContext();
});
