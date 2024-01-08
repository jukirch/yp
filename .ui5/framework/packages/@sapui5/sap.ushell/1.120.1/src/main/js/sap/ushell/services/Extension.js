// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

/**
 * @fileOverview Extension.
 * This files exposes an API to extend the launchpad with new elements.
 * It is exposed publicly and meant to be used by apps and plugins.
 *
 * @version 1.120.1
 */
sap.ui.define([
    "./Extension/FloatingContainer",
    "./Extension/Footer",
    "./Extension/Item",
    "./Extension/Header",
    "./Extension/SidePane",
    "./Extension/ToolArea",
    "sap/ushell/Container",
    "sap/ushell/utils"
], function (
    FloatingContainerArea,
    FooterItem,
    ExtensionItem,
    HeaderArea,
    SidePaneArea,
    ToolAreaArea,
    Container,
    ushellUtils
) {
    "use strict";

    /**
     * @alias sap.ushell.services.Extension
     * @class
     * @classdesc The Unified Shell's Extension service.
     * Allows adding extensions on the user's home page.
     *
     * <b>Note:</b> To retrieve a valid instance of this service, it is necessary to call
     * <code>sap.ushell.Container.getServiceAsync("Extension")</code>. For details, see
     * {@link sap.ushell.services.Container#getServiceAsync}.
     *
     * <br>
     * All extension items and extension areas are instantiated as invisible.
     * You have to call .show<...> to make them visible.
     *
     * @hideconstructor
     *
     * @since 1.120.0
     * @experimental since 1.120.0. Restriction: API calls might be ignored for apps running in an iframe
     * @public
     */
    function Extension () { }

    // ========================================== Helper ====================================================================

    /**
     * Creates a function which scopes a specific control to a single visibility handler.
     * The new function combines a show and hide function.
     * @param {string} controlId The id of the control.
     * @param {function} show The show function.
     * @param {function} hide The hide function.
     * @returns {function} The scoped visibility handler.
     *
     * @since 1.120.0
     * @private
     */
    Extension.prototype._createItemVisibilityHandler = function (controlId, show, hide) {
        return async function visibilityHandler (visible, currentState, state) {
            const states = state ? [state] : undefined;
            if (visible) {
                await ushellUtils.promisify(show(controlId, currentState, states));
                return;
            }
            await ushellUtils.promisify(hide(controlId, currentState, states));
        };
    };

    /**
     * Utility function to await a function call.
     * @param {function} create The create function.
     * @param {Array<*>} createArgs The list of arguments.
     * @returns {Promise<sap.ui.core.Control>} The created control.
     *
     * @since 1.120.0
     * @private
     */
    Extension.prototype._createControl = async function (create, createArgs) {
        return ushellUtils.promisify(create(...createArgs));
    };

    // ========================================== Header ====================================================================

    /**
     * @returns {Promise<sap.ushell.services.Extension.Header>} The extension interface for the header.
     *
     * @since 1.120.0
     * @private
     * @ui5-restricted
     */
    Extension.prototype.getHeader = async function () {
        return new HeaderArea();
    };

    // ========================================== Header - Items ====================================================================

    /**
     * Creates a header item in the shell header.
     * @param {object} controlProperties The properties that will be passed to the created control.
     * @param {object} [parameters] Additional parameters.
     * @param {string} [parameters.position=end] Possible values are <code>begin</code> and <code>end</code>.
     * @returns {Promise<sap.ushell.services.Extension.Item>} The newly created header item.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.createHeaderItem = async function (controlProperties, parameters = {}) {
        const { position } = parameters;
        const aValidPositions = ["begin", "end", undefined];
        if (!aValidPositions.includes(position)) {
            throw new Error(`Unexpected Input: '${position}' is not a valid position!`);
        }

        if (position === "begin") {
            return this._createHeaderStartItem(controlProperties);
        }
        // "end" or undefined
        return this._createHeaderEndItem(controlProperties);
    };

    /**
     * Creates a header item in the shell header next to the company logo.
     * @param {object} controlProperties The properties that will be passed to the created control.
     * @returns {Promise<sap.ushell.services.Extension.Item>} The newly created header item.
     *
     * @since 1.120.0
     * @private
     */
    Extension.prototype._createHeaderStartItem = async function (controlProperties) {
        const oRenderer = Container.getRendererInternal();

        const aCreateArgs = [
            controlProperties,
            false, // visible
            undefined, // currentState
            undefined // states
        ];
        const fnCreate = oRenderer.addHeaderItem.bind(oRenderer);
        const fnShow = oRenderer.showHeaderItem.bind(oRenderer);
        const fnHide = oRenderer.hideHeaderItem.bind(oRenderer);

        const oControl = await this._createControl(fnCreate, aCreateArgs);
        const fnVisibilityHandler = this._createItemVisibilityHandler(oControl.getId(), fnShow, fnHide);

        return new ExtensionItem(oControl, fnVisibilityHandler);
    };

    /**
     * Creates a header item in the shell header next to the user action menu.
     * @param {object} controlProperties The properties that will be passed to the created control.
     * @returns {Promise<sap.ushell.services.Extension.Item>} The newly created header item.
     *
     * @since 1.120.0
     * @private
     */
    Extension.prototype._createHeaderEndItem = async function (controlProperties) {
        const oRenderer = Container.getRendererInternal();

        const aCreateArgs = [
            controlProperties,
            false, // visible
            undefined, // currentState
            undefined // states
        ];
        const fnCreate = oRenderer.addHeaderEndItem.bind(oRenderer);
        const fnShow = oRenderer.showHeaderEndItem.bind(oRenderer);
        const fnHide = oRenderer.hideHeaderEndItem.bind(oRenderer);

        const oControl = await this._createControl(fnCreate, aCreateArgs);
        const fnVisibilityHandler = this._createItemVisibilityHandler(oControl.getId(), fnShow, fnHide);

        return new ExtensionItem(oControl, fnVisibilityHandler);
    };

    // ========================================== SubHeader ====================================================================

    /**
     * Creates a new sub header which is positioned below the header.
     *
     * <p><b>Note:</b> Only one sub header is displayed at once</p>
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @param {object} controlProperties The properties that will be passed to the created control.
     * @param {object} [parameters] Additional parameters.
     * @param {string} [parameters.controlType=sap.m.Bar] Defines the <code>controlType</code>.
     * @returns {Promise<sap.ushell.services.Extension.Item>} The newly created sub header.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.createSubHeader = async function (controlProperties, parameters = {}) {
        const oRenderer = Container.getRendererInternal();

        const aCreateArgs = [{
            controlType: parameters.controlType || "sap.m.Bar",
            oControlProperties: controlProperties,
            bIsVisible: false,
            bCurrentState: undefined,
            aStates: undefined
        }];
        const fnCreate = oRenderer.addShellSubHeader.bind(oRenderer);
        const fnShow = oRenderer.showSubHeader.bind(oRenderer);
        const fnHide = oRenderer.hideSubHeader.bind(oRenderer);

        const oControl = await this._createControl(fnCreate, aCreateArgs);
        const fnVisibilityHandler = this._createItemVisibilityHandler(oControl.getId(), fnShow, fnHide);

        // hide
        // fnVisibilityHandler(false, true, []);

        return new ExtensionItem(oControl, fnVisibilityHandler);
    };

    // ========================================== SidePane ====================================================================

    /**
     * Returns the API for the SidePane which is located next to the launchpad content.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @returns {Promise<sap.ushell.services.Extension.SidePane>} The SidePane.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.getSidePane = async function () {
        return new SidePaneArea();
    };

    // ========================================== ToolArea ====================================================================

    /**
     * Returns the API for the ToolArea which is located next to the launchpad content.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @returns {Promise<sap.ushell.services.Extension.ToolArea>} The ToolArea.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.getToolArea = async function () {
        return new ToolAreaArea();
    };

    // ========================================== UserAction ====================================================================

    /**
     * Creates a user action in the user action menu.
     * @param {object} controlProperties The properties that will be passed to the created control.
     * @param {object} [parameters] Additional parameters.
     * @param {string} [parameters.controlType=sap.m.Button] Defines the <code>controlType</code>.
     * @returns {Promise<sap.ushell.services.Extension.Item>} The newly created user action.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.createUserAction = async function (controlProperties, parameters = {}) {
        const oRenderer = Container.getRendererInternal();

        const aCreateArgs = [{
            controlType: parameters.controlType || "sap.m.Button",
            oControlProperties: controlProperties,
            bIsVisible: false,
            bCurrentState: undefined,
            aStates: undefined
        }];
        const fnCreate = oRenderer.addUserAction.bind(oRenderer);
        const fnShow = oRenderer.showActionButton.bind(oRenderer);
        const fnHide = oRenderer.hideActionButton.bind(oRenderer);

        const oControl = await this._createControl(fnCreate, aCreateArgs);
        const fnVisibilityHandler = this._createItemVisibilityHandler(oControl.getId(), fnShow, fnHide);

        return new ExtensionItem(oControl, fnVisibilityHandler);
    };

    // ========================================== Footer ====================================================================

    /**
     * Creates a new footer which is positioned below the launchpad content.
     *
     * <p><b>Note:</b> Only one footer is displayed at once. Any new footer will replace the previous one</p>
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @param {object} controlProperties The properties that will be passed to the created control.
     * @param {object} [parameters] Additional parameters.
     * @param {string} [parameters.controlType=sap.m.Bar] Defines the <code>controlType</code>.
     * @returns {Promise<sap.ushell.services.Extension.Footer>} The newly created footer.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.createFooter = async function (controlProperties, parameters = {}) {
        const oRenderer = Container.getRendererInternal();

        const aCreateArgs = [{
            controlType: parameters.controlType || "sap.m.Bar",
            oControlProperties: controlProperties
        }];
        const fnCreate = oRenderer.setShellFooter.bind(oRenderer);

        const oControl = await this._createControl(fnCreate, aCreateArgs);

        return new FooterItem(oControl);
    };

    // ========================================== UserSettings ====================================================================

    /**
     * Adds an entry to the user settings dialog box including the UI control that appears when the user clicks the new entry,
     * and handling of user settings actions such as SAVE and CANCEL.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @param {object} properties The data of the new added user settings entry.
     * @param {string} [properties.entryHelpID] The ID of the object.
     * @param {string} properties.title The title of the entry to be presented in the list in the user settings dialog box. We recommend using a string from the translation bundle.
     * @param {string|function} properties.value A string to be presented as the sub title of the entry OR a function which resolves the sub title.
     * @param {function} properties.content A function that resolves the content which has to be a {@link sap.ui.core.Control}. A SAPUI5 view instance can also be returned.
     *      The result will be displayed in the settings as content for this entry.
     * @param {function} properties.onSave A callback which is called when the user clicks "save" in the user settings dialog. The function has to return a native promise.
     *      If an error occurs, pass the error message via rejected promise. Errors are displayed in the common log.
     * @param {function} properties.onCancel A callback which is called when the user closes the user settings dialog without saving any changes.
     * @param {boolean} [properties.provideEmptyWrapper=false] Set this value to <code>true</code> if you want that your content is displayed without the standard header.
     * @returns {Promise} Resolves once the settings entry was added.
     *
     * @since 1.120.0
     * @public
     */
    Extension.prototype.addUserSettingsEntry = async function (properties) {
        const oRenderer = Container.getRendererInternal();
        await ushellUtils.promisify(oRenderer.addUserPreferencesEntry(properties));
    };

    /**
     * Adds an entry to the user settings dialog box including the UI control that appears when the user clicks the new entry,
     * and handling of user settings actions such as SAVE and CANCEL.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @param {object} properties The data of the new added user settings entry.
     * @param {string} [properties.entryHelpID] The ID of the object.
     * @param {string} properties.title The title of the entry to be presented in the list in the user settings dialog box. We recommend using a string from the translation bundle.
     * @param {string|function} properties.value A string to be presented as the sub title of the entry OR a function which resolves the sub title.
     * @param {function} properties.content A function that resolves the content which has to be a {@link sap.ui.core.Control}. A SAPUI5 view instance can also be returned.
     *      The result will be displayed in the settings as content for this entry.
     * @param {function} properties.onSave A callback which is called when the user clicks "save" in the user settings dialog. The function has to return a native promise.
     *      If an error occurs, pass the error message via rejected promise. Errors are displayed in the common log.
     * @param {function} properties.onCancel A callback which is called when the user closes the user settings dialog without saving any changes.
     * @param {boolean} [properties.provideEmptyWrapper=false] Set this value to <code>true</code> if you want that your content is displayed without the standard header.
     * @param {string} [properties.groupingId] The ID of the group this entry should be included in.
     * @param {string} [properties.groupingTabTitle] The tab title of the entry, when this entry is grouped.
     * @param {string} [properties.groupingTabHelpId] The help ID for the grouped tab, when this entry is grouped.
     * @returns {Promise} Resolves once the settings entry was added.
     *
     * @since 1.120.0
     * @private
     * @ui5-restricted sap.fe, sap.esh.search.ui
     */
    Extension.prototype.addGroupedUserSettingsEntry = async function (properties) {
        const oRenderer = Container.getRendererInternal();
        await ushellUtils.promisify(oRenderer.addUserPreferencesGroupedEntry(properties));
    };

    // ========================================== FloatingContainer ====================================================================

    /**
     * Returns the API for the FloatingContainer.
     * <p><b>Restriction:</b> Might be ignored for apps running in an iframe</p>
     * @returns {Promise<sap.ushell.services.Extension.FloatingContainer>} The FloatingContainer.
     *
     * @since 1.120.0
     * @private
     * @ui5-restricted
     */
    Extension.prototype.getFloatingContainer = async function () {
        return new FloatingContainerArea();
    };

    Extension.hasNoAdapter = true;
    return Extension;
});
