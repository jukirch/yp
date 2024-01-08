sap.ui.define([
    "sap/suite/ui/commons/BasePanel",
    "sap/m/GenericTile",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/IllustratedMessage",
    "sap/ui/core/theming/Parameters",
    "sap/ushell/utils/WindowUtils"
], function (
    BasePanel,
    GenericTile,
    HBox,
    VBox,
    IllustratedMessage,
    Parameters,
    WindowUtils
) {
    "use strict";

    var BaseAppPanel = BasePanel.extend("sap.suite.ui.commons.BaseAppPanel", {
        metadata : {
            properties : {},
            defaultAggregation: "apps",
            aggregations: {
                apps: {type: "sap.suite.ui.commons.App", singularName: "app", multiple: true}
            }
        }
    });

    BaseAppPanel.prototype.getDefaultAppColor = function () {
        const sLegendName = "sapLegendColor9";
        return {
            key: sLegendName,
            value: Parameters.get({
                name: sLegendName
            }),
            assigned: false
        };
    };

    BaseAppPanel.prototype.setInnerControls = function(){
        let aApps = this.getApps() || [];
        if (!this._oWrapper) {
            aApps = (aApps).map((app) => {
                return new GenericTile({
                    id: `${app.getId()}--tile`,
                    scope: "ActionMore",
                    state: "Loaded",
                    mode:"IconMode",
                    sizeBehavior: "Small",
                    header: app.getTitle(),
                    tileBadge: app.getNumber?.(),
                    //subheader: "",
                    backgroundColor: app.getBgColor() || this.getDefaultAppColor()?.key,
                    tileIcon: app?.getIcon?.(),
                    url: WindowUtils.getLeanURL(app.getUrl()),
                    frameType: "TwoByHalf",
                    renderOnThemeChange: true,
                    dropAreaOffset:  4,
                    press: (e) => app.launchApp(e, app.getUrl(), app.getTitle())
                }).addStyleClass("sapUiTinyMargin");
            });
            let oControl;
            if (aApps.length) {
                oControl = new HBox({
                    wrap: "Wrap",
                    backgroundDesign: "Solid",
                    items: [...aApps]
                });
            } else {
                const oIllustratedMessage = new IllustratedMessage({
                    illustrationSize: "Spot",
                    illustrationType: "sapIllus-AddColumn",
                    title: this.getResourceBundle().getText("noAppsTitle"),
                    description: this.getNoDataText()
                });
                oControl = new VBox({
                    wrap: "Wrap",
                    backgroundDesign: "Solid",
                    items: [oIllustratedMessage]
                });
            }
            this._oWrapper = oControl;
        }
        this.addContent(this._oWrapper);
    };

    BaseAppPanel.prototype._ProcessAppArray = function (aApps) {
        return aApps.filter(function (app) {
            return app.appType === "Application";
        }).map(function(aApp){
            aApp.orgAppId = aApp.appId;
            aApp.appId = aApp.url;
            aApp.leanURL = WindowUtils.getLeanURL(aApp.url);
            return aApp;
        });
    };

    BaseAppPanel.prototype.init = function () {
        BasePanel.prototype.init.apply(this, arguments);
    };

    return BaseAppPanel;
});