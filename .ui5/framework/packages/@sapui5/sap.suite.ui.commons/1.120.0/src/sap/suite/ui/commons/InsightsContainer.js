sap.ui.define([
    "sap/suite/ui/commons/BaseContainer"
], function (
    BaseContainer
) {
    "use strict";

    var InsightsContainer = BaseContainer.extend("sap.suite.ui.commons.InsightsContainer", {
        renderer: {
            apiVersion: 2
        }
    });

    /**
     * Init lifecycle method
     *
     */
    InsightsContainer.prototype.init = function() {
        this.setTitle(this.getResourceBundle().getText("insights"));
        BaseContainer.prototype.init.apply(this, arguments);
    };



    InsightsContainer.prototype._onPressMenuButton = function() {

    };

    return InsightsContainer;
});
