// Copyright (c) 2009-2023 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/thirdparty/jquery",
    "sap/ui/thirdparty/URI",
    "sap/ui/model/resource/ResourceModel",
    "sap/m/Dialog",
    "sap/m/DialogType",
    "sap/m/Button",
    "sap/m/ButtonType",
    "sap/m/Text"
], function (jQuery, URI, ResourceModel, Dialog, DialogType, Button, ButtonType, Text) {
    "use strict";
    var oUriParams = new URI().search(true);
    var sAppGatewayRoute = "/sap/fiori";
    var sAppIdParam = "sap-ui-app-id";
    var sBackendPrefix = "/sap/bc";
    var APP_VERSION_REGEX = /sv\/.+\/manifest/;
    var prefix;
    function fnAppInfoURL (appId) {
        // app info is served from app-index
        return sBackendPrefix + "/ui2/app_index/ui5_app_info_json?id=" + appId;
    }
    function buildAppInfoUrlFromStartupParams (sUrl) {
        var result = {};
        var ui5appruntimeUrl = sUrl || document.URL;
        var uri = new URI(ui5appruntimeUrl);
        var startupParam = uri.query(true)["sap-startup-params"];
        var decodedStartupParam = (new URI("?" + startupParam)).query(true);
        var appInfoUrl;
        Object.keys(decodedStartupParam).forEach(function (key) {
            result[key.toLowerCase()] = decodedStartupParam[key];
        });
        if (result["sap-app-uri"] && result["sap-app-name"]) {
            var sapAppURI = (result["sap-app-uri"]).replace(/\/$/, "");
            var sapAppName = result["sap-app-name"];
            prefix = sAppGatewayRoute + "/" + sapAppName + "/";
            appInfoUrl = sAppGatewayRoute + "/" + sapAppName + sapAppURI;
        }
        //fallback for webapp html apps
        if (appInfoUrl) {
            appInfoUrl = appInfoUrl.replace(".webapp", "/webapp");
        }
        return appInfoUrl;
    }
    function getErrorMessageDialog () {
        if (!this.oErrorMessageDialog) {
            var oI18nAppModel = new ResourceModel({
                bundleUrl: "/sap/fiori/appruntime/i18n/i18nApp.properties"
            });
            this.oErrorMessageDialog = new Dialog({
                type: DialogType.Message,
                title: oI18nAppModel.getProperty("ERROR_DIALOG_TITLE"),
                state: sap.ui.core.ValueState.Error,
                content: new Text({ text: oI18nAppModel.getProperty("MISSING_PARAMETERS_ERROR")}),
                contentWidth: "30%",
                beginButton: new Button({
                    type: ButtonType.Emphasized,
                    text: oI18nAppModel.getProperty("OK_BUTTON"),
                    press: function () {
                        this.oErrorMessageDialog.close();
                        sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oCrossAppNavigator) {
                            oCrossAppNavigator.toExternal({
                                target: {
                                    semanticObject: "Shell",
                                    action: "home"
                                }
                            });
                        });
                    }.bind(this)
                })
            });
        }
        return this.oErrorMessageDialog;
    }
    function updateInterceptorPrefix (oFilterFactory, oCacheBusterFilter, appId) {
        if (prefix) {
            // registering the doorway mapping filter
            var oFilterManager = sap.ushell.cloudServices.interceptor.FilterManager.getInstance();
            var oDoorWayMappingFilter = oFilterFactory.getFilter("sap.ushell.cloudServices.interceptor.filter.DoorWayMappingFilter");
            if (!oFilterManager.isRegistered("sap.ushell.cloudServices.interceptor.filter.DoorWayMappingFilter")) {
                oFilterManager.register("sap.ushell.cloudServices.interceptor.filter.DoorWayMappingFilter");
            }
            // Update prefix
            oDoorWayMappingFilter.addAppToStack(appId, prefix);
            oCacheBusterFilter.addAppToStack(appId, prefix);
        }
    }
    function getAppInfo (appId, sUrl) {
        var oDeferred = new jQuery.Deferred();
        appId = appId || oUriParams[sAppIdParam];
        jQuery.ajax(fnAppInfoURL(appId))
            .then(function (appInfo) {
                if (appInfo && !(Object.keys(appInfo).length === 0)) {
                    appInfo = (appId in appInfo) ? appInfo[appId] : appInfo;
                    // rewrite libs url
                    var libs = appInfo && appInfo.asyncHints && appInfo.asyncHints.libs || [];
                    libs.forEach(function (lib) {
                        if (lib && lib.url && lib.url.final) {
                            lib.url.url = sAppGatewayRoute + lib.url.url;
                        }
                    });
                    // rewrite components url
                    var components = appInfo && appInfo.asyncHints && appInfo.asyncHints.components || [];
                    components.forEach(function (component) {
                        if (component && component.url && component.url.final) {
                            component.url.url = sAppGatewayRoute + component.url.url;
                        }
                    });
                    // rewrite app url
                    if ("url" in appInfo) {
                        appInfo.url = sAppGatewayRoute + appInfo.url;
                        prefix = appInfo.url;
                    } else {
                        // apps that are not supported by appIndex
                        appInfo.url = buildAppInfoUrlFromStartupParams(sUrl);
                    }
                    // sap-app-uri or sap-app-name were not provided for appIndex unsupported apps.
                    if (!appInfo.url) {
                        this.oErrorMessageDialog = getErrorMessageDialog.call(this);
                        this.oErrorMessageDialog.open();
                        return oDeferred.reject(new Error("sap-app-uri & sap-app-name parameters were not provided"));
                    }
                    // Extract version from appIndex response for browser caching
                    var appVersion;
                    var oFilterFactory = sap.ushell.cloudServices.interceptor.FilterFactory.getInstance();
                    var oCacheBusterFilter = oFilterFactory.getFilter("sap.ushell.cloudServices.interceptor.filter.CacheBusterFilter");
                    if ("manifestUrl" in appInfo) {
                        if (APP_VERSION_REGEX.test(appInfo.manifestUrl)) {
                            var result = APP_VERSION_REGEX.exec(appInfo.manifestUrl);
                            var split = result[0].split("/");
                            appVersion = split[1];
                        }
                    }
                    if (appVersion) {
                        oCacheBusterFilter.setTimestamp(appVersion);
                    } else {
                        oCacheBusterFilter.setTimestamp();
                    }
                    updateInterceptorPrefix(oFilterFactory, oCacheBusterFilter, appId);
                    return oDeferred.resolve(appInfo);
                }
                return oDeferred.reject(new Error("AppInfo from AppIndex is empty"));
            })
            .fail(function (error) {
                oDeferred.reject(error);
            });
        return oDeferred.promise();
    }
    sap.ui.define("appInfoService", [], function () {
        return {
            getAppInfo: getAppInfo
        };
    });
});
