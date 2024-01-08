sap.ui.define([
    "sap/ui/core/Control",
    "./library",
    "sap/m/IconTabBar",
    "sap/m/IconTabFilter",
    "sap/m/Title",
    "sap/m/HBox",
    "sap/m/FlexBox",
    "sap/m/Button",
    "sap/ui/core/CustomData",
    "sap/ui/core/Lib"
], function (
    Control,
    library,
    IconTabBar,
    IconTabFilter,
    Title,
    HBox,
    FlexBox,
    Button,
    CustomData,
    CoreLib
) {
    "use strict";

    const LayoutType = library.LayoutType;

    const BaseContainer = Control.extend("sap.suite.ui.commons.BaseContainer", {
        metadata : {
            properties : {
                title: { type: "string", group: "Misc", defaultValue: '' },
                layout: { type: "sap.suite.ui.commons.LayoutType", group: "Misc", defaultValue: LayoutType.SideBySide },
                selectedKey: { type: "string", group: "Misc", defaultValue: '' }
            },
            defaultAggregation: "content",
            aggregations: {
                content: { type: "sap.suite.ui.commons.BasePanel", singularName: "content", multiple: true },
                actionButtons: { type: "sap.m.Button", multiple: true, singularName: "actionButton", visibility: "hidden" },
                menuButtons: { type: "sap.suite.ui.commons.MenuButton", multiple: true, singularName: "menuButton", visibility: "hidden" }
            }
        }
    });

    /**
     * Get library resource bundle
     *
     * @returns {Object} library resource bundle
     */
    BaseContainer.prototype.getResourceBundle = function () {
        this._resBundle = this._resBundle || CoreLib.getResourceBundleFor("sap.suite.ui.commons");
        return this._resBundle;
    };

    /**
     * Init lifecycle method
     *
     */
    BaseContainer.prototype.init = function () {
        this._createHeaderIfRequired(this);
    };

    /**
     * Returns container header
     *
     * @returns {Object} container header
     */
    BaseContainer.prototype.getHeader = function () {
        return this._controlMap.get(`${this.getId()}-header`);
    };

    /**
     * Create inner control for storing content from panel
     *
     */
    BaseContainer.prototype._createInnerControl = function () {
        const layout = this.getLayout();

        if (layout === LayoutType.Horizontal || layout === LayoutType.Vertical) {
            if (!this._wrapper) {
                this._wrapper = new FlexBox(`${this.getId()}-wrapper`, {
                    width: "100%",
                    renderType: "Bare"
                }).addStyleClass("sapUiBaseWrapper");
                this._wrapper.setParent(this);
            }
            this._wrapper.setDirection(layout === LayoutType.Horizontal ? "Row" : "Column");
        } else if (!this._iconTabBar) {
            this._iconTabBar = new IconTabBar(`${this.getId()}-iconTabBar`, {
                expandable: false,
                backgroundDesign: "Transparent",
                headerMode: "Inline",
                headerBackgroundDesign: "Transparent",
                select: this.onPanelSelect.bind(this)
            });
            this._iconTabBar.setParent(this);
        }
    };

    /**
     * Returns inner control corresponding to the specified layout
     *
     * @returns {Object} inner control based on the layout
     */
    BaseContainer.prototype.getInnerControl = function () {
        return this.getLayout() === LayoutType.SideBySide ? this._iconTabBar : this._wrapper;
    };

    /**
     * Adds corresponding control to panel. The control would be added to the
     * corresponding target inner control based on the layout.
     *
     * @param {Object} panel - panel to which control must be added
     * @param {Object} control - control to be added
     */
    BaseContainer.prototype.addToPanel = function (panel, control) {
        if (this.getLayout() === LayoutType.SideBySide) {
            this._fetchTabFilter(panel)?.addContent(control);
        } else {
            this._controlMap.get(`${panel.getId()}-wrapper`)?.addItem(control);
        }
    };

    /**
     * Creates and returns IconTabBarFilter for the specified panel to be placed
     * in the IconTabBar inner control in case of SideBySide layout
     *
     * @param {Object} panel - panel whose icon tab filter must be fetched
     * @returns {Object} IconTabBarFilter for the specified panel
     */
    BaseContainer.prototype._fetchTabFilter = function (panel) {
        const id = `${panel.getId()}-tabFilter`;
        this._controlMap = this._controlMap || new Map();

        if (!this._controlMap.get(id)) {
            const iconTabFilter = new IconTabFilter(id, {
                key: panel.getKey(),
                text: panel.getTitle()
            });
            iconTabFilter.addCustomData(
                new CustomData({
                    key: "sap-ui-fastnavgroup",
                    value: "true",
                    writeToDom: true
                })
            );
            this._controlMap.set(id, iconTabFilter);
        }

        //Add panel content to the created filter
        panel.getContent()?.forEach((oContent) => this._controlMap.get(id).addContent(oContent));

        return this._controlMap.get(id);
    };

     /**
     * Creates and returns a button for the corresponding header ActionButton
     * or MenuButton elements
     *
     * @param {Object} headerButton - ActionButton or MenuButton element
     * @returns {Object} Button instance created for the header element
     */
    BaseContainer.prototype._fetchHeaderButton = function (headerButton) {
        const id = headerButton.getId();
        this._controlMap = this._controlMap || new Map();

        if (!this._controlMap.get(id)) {
            this._controlMap.set(id, new Button(`${id}-btn`, {
                type: "Transparent",
                press: (oEvent) => headerButton.firePress({ button: oEvent.getSource() })
            }));
        }

        //Update button details
        const button = this._controlMap.get(id);
        button.setText(headerButton.getText());
        button.setIcon(headerButton.getIcon());

        return button;
    };

    /**
     * Returns the selected panel in the IconTabBar inner control in
     * case of SideBySide layout
     *
     * @returns {Object} selected panel
     */
    BaseContainer.prototype.getSelectedPanel = function () {
        const panel = this.getContent()?.find((panel) => panel.getKey() === this.getSelectedKey()) || this.getContent()?.[0];
        this.setProperty("selectedKey", panel?.getKey(), true);

        return panel;
    };

    BaseContainer.prototype.setTitle = function (sTitle) {
        //suppress invalidate to prevent container re-rendering. re-render only the concerned element
        this.setProperty("title", sTitle, true);
        this._controlMap?.get(`${this.getId()}-header-title`).setText(sTitle);
        return this;
    };

    /**
     * onBeforeRendering lifecycle method
     *
     */
    BaseContainer.prototype.onBeforeRendering = function () {
        //create layout-specific inner control
        this._createInnerControl();

        //fetch and update container header
        this.updateContainerHeader();

        //add content from all panels to inner control
        this._addAllPanelContent();
    };

    /**
     * Update container header information
     */
    BaseContainer.prototype.updateContainerHeader = function () {
        //clear container header elements
        this._controlMap.get(this.getId() + "-header-contentLeft").removeAllItems();
        this._controlMap.get(this.getId() + "-header-contentRight").removeAllItems();

        //update container header elements
        this._updateHeader(this);
    };

    /**
     * Returns header of the specified panel after updating it
     *
     * @param {Object} panel - panel to be updated
     * @returns {Object} header associated with the panel
     */
    BaseContainer.prototype.updateAndFetchPanelHeader = function (panel) {
        const header = this._createHeaderIfRequired(panel);
        const isTitleVisible = panel.getTitle()?.trim().length > 0;

        //update panel header elements
        this._updateHeader(panel);

        //add header styling only if any of the header elements are visible
        header.toggleStyleClass("sapUiPanelHeader", isTitleVisible || panel.getAggregation("menuButtons")?.length > 0 || panel.getAggregation("actionButtons")?.length > 0);

        return header;
    };

    /**
     * Updates header information of a specified container or a panel
     *
     * @param {Object} control - can be container or panel
     */
    BaseContainer.prototype._updateHeader = function (control) {
        const isSideBySideLayout = this.getLayout() === LayoutType.SideBySide;
        const isContainer = control.isA("sap.suite.ui.commons.BaseContainer");

        //Update Title
        this._controlMap.get(control.getId() + "-header-title").setText(control.getTitle());
        this._controlMap.get(control.getId() + "-header-title").setVisible(control.getTitle()?.trim().length > 0);

        //Update Menu Buttons
        (isContainer && isSideBySideLayout ? this.getSelectedPanel() : control)
            .getAggregation("menuButtons")
            ?.forEach((oMenuButton) => this._controlMap.get(control.getId() + "-header-contentLeft").addItem(this._fetchHeaderButton(oMenuButton)));

        //Update Action Buttons
        (isContainer && isSideBySideLayout ? this.getSelectedPanel() : control)
            .getAggregation("actionButtons")
            ?.forEach((oActionButton) => this._controlMap.get(control.getId() + "-header-contentRight").addItem(this._fetchHeaderButton(oActionButton)));
    };

    /**
     * Creates and returns a wrapper for containing the specified panel
     * content in case of Horizontal and Vertical layout
     *
     * @param {Object} panel - panel for which wrapper has to created
     * @returns {Object} wrapper container for the given panel
     */
    BaseContainer.prototype._fetchPanelContentWrapper = function (panel) {
        const id = `${panel.getId()}-contentWrapper`;
        this._controlMap = this._controlMap || new Map();

        if (!this._controlMap.get(id)) {
            this._controlMap.set(id, new FlexBox(id, {
                width: panel.getWidth(),
                height: panel.getHeight(),
                direction: "Column",
                renderType: "Bare"
            }));
        }

        //Add header as the first item in case of Horizontal and Vertical layout
        this._controlMap.get(id).addItem(this.updateAndFetchPanelHeader(panel));
        panel.getContent()?.forEach((oContent) => this._controlMap.get(id).addItem(oContent));

        return this._controlMap.get(id);
    };

    /**
     * Add content from all panels to the layout-specific inner control
     *
     */
    BaseContainer.prototype._addAllPanelContent = function () {
        const aPanels = this.getContent();

        if (this.getLayout() === LayoutType.SideBySide) {
            this._iconTabBar.removeAllItems();
            aPanels?.forEach((panel) => this._iconTabBar.addItem(this._fetchTabFilter(panel)));
            this._iconTabBar.setSelectedKey(this.getSelectedKey());
        } else {
            this._wrapper.removeAllItems();
            aPanels?.forEach((panel) => this._wrapper.addItem(this._fetchPanelContentWrapper(panel)));
        }
    };

    /**
     * Creates and returns header for both container as well as panels
     *
     * @param {Object} control - can be a container or a panel
     * @returns {Object} header for the given container or panel
     */
    BaseContainer.prototype._createHeaderIfRequired = function (control) {
        const controlId = control.getId();
        const id = `${controlId}-header`;
        const isPanel = control.isA("sap.suite.ui.commons.BasePanel");
        this._controlMap = this._controlMap || new Map();

        if (!this._controlMap.get(id)) {
            //create header elements
            this._controlMap.set(`${controlId}-header-title`, new Title(`${controlId}-title`, { titleStyle: isPanel ? "H6" : "H4" }));
            this._controlMap.set(`${controlId}-header-contentLeft`, new HBox(`${controlId}-contentLeft`, { renderType: "Bare" }).addStyleClass("sapUiSectionContentArea"));
            this._controlMap.set(`${controlId}-header-contentRight`, new HBox(`${controlId}-contentRight`, { renderType: "Bare" }).addStyleClass("sapUiSectionContentArea"));
            this._controlMap.set(`${controlId}-header-content`, new HBox(`${controlId}-content`, {
                width: "100%",
                justifyContent: "SpaceBetween",
                renderType: "Bare",
                items: [
                    this._controlMap.get(`${controlId}-header-contentLeft`),
                    this._controlMap.get(`${controlId}-header-contentRight`)
                ]
            }).addStyleClass("sapUiTinyMarginBegin"));

            //create header container
            this._controlMap.set(id, new HBox(`${controlId}-header`,{
                alignItems: "Center",
                items: [
                    this._controlMap.get(`${controlId}-header-title`),
                    this._controlMap.get(`${controlId}-header-content`)
                ]
            }));
            this._controlMap.get(id).setParent(this);
        }

        //add control-specific styling
        this._controlMap.get(id).addStyleClass(isPanel ? "sapUiPanelHeader" : "sapUiContainerHeader");

        return this._controlMap.get(id);
    };

    /**
     * Handler for selection of panel in SideBySide layout
     *
     * @param {Object} event - event object
     */
    BaseContainer.prototype.onPanelSelect = function (event) {
        //suppress invalidation to prevent container re-rendering. render the specific header element instead
        this.setProperty("selectedKey", event.getSource().getSelectedKey(), true);
        this.updateContainerHeader();
    };

    BaseContainer.prototype.getActionButtons = function () {
        this._aActionButtons = this._aActionButtons || this.getAggregation("actionButtons");
        return this._aActionButtons;
    };

    /**
     * Updates the count information of IconTabFilter of IconTabBar inner control
     * in case of SideBySide layout
     *
     * @param {Object} panel - associated panel
     * @param {string} count - updated count
     */
    BaseContainer.prototype.setPanelCount = function (panel, count) {
        if (this.getLayout() === LayoutType.SideBySide) {
            this._fetchTabFilter(panel).setCount(count);
        }
    };

    /**
     * Removes a panel from the container and removes it from the
     * corresponding inner control
     *
     * @param {Object} panel - panel to be removed
     */
    BaseContainer.prototype.removeContent = function (panel) {
        if (this.getSelectedKey() && this.getSelectedKey() === panel.getKey()) {
            this.setProperty("selectedKey", undefined, true);
        }
        this.removeAggregation("content", panel);
    };

    return BaseContainer;
});
