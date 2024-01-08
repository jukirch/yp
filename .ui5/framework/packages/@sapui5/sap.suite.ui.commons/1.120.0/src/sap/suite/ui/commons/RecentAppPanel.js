sap.ui.define([
    "sap/suite/ui/commons/BaseAppPanel",
    "sap/suite/ui/commons/App",
    "sap/base/Log"
], function (
    BaseAppPanel,
    App,
    Log
) {
    "use strict";

    const RecentAppPanel = BaseAppPanel.extend("sap.suite.ui.commons.RecentAppPanel");

    RecentAppPanel.prototype._getRecentApps = async function () {
        try {
            const UserRecentsService = await sap.ushell.Container?.getServiceAsync("UserRecents");
            const aRecentApps = await UserRecentsService?.getRecentActivity() || [];
            return this._ProcessAppArray(aRecentApps);
        } catch (error) {
            Log.error(error);
                return [];
        }
    };

    RecentAppPanel.prototype.init = async function () {
        try {
            //Configure Header
            this.setKey("recentApps");
            this.setTitle(this.getResourceBundle().getText("recentlyUsedTab"));
            const aRecentApps = await this._getRecentApps() || [];
            aRecentApps.forEach((app, index) => {
                this.addApp(new App({
                    id: `recentApps-${index}`,
                    title: app.title,
                    bgColor: app.BGColor,
                    icon: app.icon,
                    url: app.url
                }));
            });
            this.setInnerControls();
        } catch (error) {
            Log.error(error);
        }
        BaseAppPanel.prototype.init.apply(this, arguments);
    };

    /**
     * Get the text for the "No Data" message.
     *
     * @returns {string} The text for the "No Data" message.
     */
    RecentAppPanel.prototype.getNoDataText = function () {
        return this.getResourceBundle().getText("noRecentAppsDescription");
    };

    return RecentAppPanel;
});