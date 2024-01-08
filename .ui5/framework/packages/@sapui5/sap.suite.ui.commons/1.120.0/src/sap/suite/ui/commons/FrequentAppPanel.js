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

    const FrequentAppPanel = BaseAppPanel.extend("sap.suite.ui.commons.FrequentAppPanel");

    FrequentAppPanel.prototype._getFrequentApps = async function () {
        try {
            const UserRecentsService = await sap.ushell.Container?.getServiceAsync("UserRecents");
            const aFrequentApps = await UserRecentsService?.getFrequentActivity() || [];
            return this._ProcessAppArray(aFrequentApps);
        } catch (error) {
            Log.error(error);
                return [];
        }
    };

    FrequentAppPanel.prototype.init = async function () {
        try {
            //Configure Header
            this.setKey("frequentApps");
            this.setTitle(this.getResourceBundle().getText("frequentlyUsedTab"));
            const aFrequentApps = await this._getFrequentApps() || [];
            aFrequentApps.forEach((app, index) => {
                this.addApp(new App({
                    id: `frequentApps-${index}`,
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
    FrequentAppPanel.prototype.getNoDataText = function () {
        return this.getResourceBundle().getText("noFreqAppsDescription");
    };

    return FrequentAppPanel;
});