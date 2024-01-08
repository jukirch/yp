// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/core/service/ServiceFactoryRegistry",
    "sap/ui/core/service/ServiceFactory",
    "sap/ui/core/service/Service",
    "../../../ui5service/_ShellUIService/shelluiservice.class.factory",
    "sap/ushell/appRuntime/ui5/AppCommunicationMgr",
    "sap/ushell/appRuntime/ui5/AppRuntimeService",
    "sap/ushell/appRuntime/ui5/AppRuntimeContext",
    "sap/ui/thirdparty/jquery"
], function (ServiceFactoryRegistry, ServiceFactory, Service, fnDefineClass, AppCommunicationMgr, AppRuntimeService, AppRuntimeContext, jQuery) {
    "use strict";

    var oService = fnDefineClass({
        serviceRegistry: ServiceFactoryRegistry,
        serviceFactory: ServiceFactory,
        service: Service
    });

    var sLastSetTitle,
        bRegistered = false,
        fnBackNavigationCallback;

    var ShellUIServiceProxy = oService.extend("sap.ushell.appRuntime.services.ShellUIService", {

        setTitle: function (sTitle) {
            if (!sTitle) {
                return;
            }
            sLastSetTitle = sTitle;
            return AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.ShellUIService.setTitle", {
                    sTitle: sTitle
                });
        },

        getTitle: function () {
            return sLastSetTitle;
        },

        setHierarchy: function (aHierarchyLevels) {
            return AppRuntimeContext.checkIntentsConversionForScube(aHierarchyLevels).then(function (aNewHierarchyLevels) {
                return AppRuntimeService.sendMessageToOuterShell(
                    "sap.ushell.services.ShellUIService.setHierarchy", {
                        aHierarchyLevels: aNewHierarchyLevels
                    });
            });
        },

        setRelatedApps: function (aRelatedApps) {
            return AppRuntimeContext.checkIntentsConversionForScube(aRelatedApps).then(function (aNewRelatedApps) {
                return AppRuntimeService.sendMessageToOuterShell(
                    "sap.ushell.services.ShellUIService.setRelatedApps", {
                        aRelatedApps: aNewRelatedApps
                    });
            });
        },

        setBackNavigation: function (fnCallback) {
            if (!bRegistered) {
                bRegistered = true;
                AppCommunicationMgr.registerCommHandlers({
                    "sap.ushell.appRuntime": {
                        oServiceCalls: {
                            handleBackNavigation: {
                                executeServiceCallFn: function (oServiceParams) {
                                    if (fnBackNavigationCallback) {
                                        fnBackNavigationCallback();
                                    } else if (AppRuntimeContext.checkDataLossAndContinue()) {
                                        window.history.back();
                                    }
                                    return new jQuery.Deferred().resolve().promise();
                                }
                            }
                        }
                    }
                });
            }

            fnBackNavigationCallback = fnCallback;
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.ui5service.ShellUIService.setBackNavigation", {
                    callbackMessage: {
                        service: "sap.ushell.appRuntime.handleBackNavigation"
                    }
                });
        },

        _getBackNavigationCallback: function () {
            return fnBackNavigationCallback;
        },

        _resetBackNavigationCallback: function () {
            this.setBackNavigation();
        }
    });

    return ShellUIServiceProxy;
});
