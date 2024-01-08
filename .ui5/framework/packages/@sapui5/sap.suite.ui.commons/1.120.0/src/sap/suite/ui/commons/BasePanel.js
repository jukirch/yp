sap.ui.define([
    "sap/ui/core/Element",
    "sap/ui/core/Lib"
], function (
    Element,
    CoreLib
) {
    "use strict";

    const BasePanel = Element.extend("sap.suite.ui.commons.BasePanel", {
        metadata : {
            properties : {
                title: { type: "string", group: "Misc", defaultValue: '' },
                key: { type: "string", group: "Misc", defaultValue: '' },
                width: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%" },
                height: { type: "sap.ui.core.CSSSize", group: "Appearance", defaultValue: "100%" }
            },
            defaultAggregation: "content",
            aggregations: {
                content: { multiple: true, singularName: "content", visibility: "hidden" },
                actionButtons: { type: "sap.m.Button", multiple: true, singularName: "actionButton", visibility: "hidden" },
                menuButtons: { type: "sap.suite.ui.commons.MenuButton", multiple: true, singularName: "menuButton", visibility: "hidden" }
            }
        }
    });

    /**
     * Get library resource bundle
     *
     * @returns {object} library resource bundle
     */
    BasePanel.prototype.getResourceBundle = function () {
        this._resBundle = this._resBundle || CoreLib.getResourceBundleFor("sap.suite.ui.commons");
        return this._resBundle;
    };

    /**
     * Cache and return panel content since the content would
     * have a different inner control as parent after rendering
     *
     * @returns {object []} - array of panel content
     */
    BasePanel.prototype.getContent = function () {
        this._aContent = this._aContent || this.getAggregation("content") || [];
        return this._aContent;
    };

    /**
     * Overridden method for adding content to a panel so that
     * it's added to the corresponding layout-specific inner
     * control as well
     *
     * @param {object} control - control to be added to the content
     */
    BasePanel.prototype.addContent = function (control) {
        this._aContent = this._aContent || this.getAggregation("content");
        this._aContent?.push(control);
        this.insertAggregation("content", control);

        //Insert into parent's layout control
        this.getParent()?.addToPanel(this, control);
    };

    /**
     * Updates the count information of IconTabFilter of IconTabBar inner control
     * in case of SideBySide layout
     *
     * @param {string} count - updated count information
     */
    BasePanel.prototype.setCount = function (count) {
        this.getParent()?.setPanelCount(this, count);
    };

    return BasePanel;
});
