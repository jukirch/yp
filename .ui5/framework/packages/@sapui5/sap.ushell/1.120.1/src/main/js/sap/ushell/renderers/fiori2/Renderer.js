// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

 /**
  * File was moved to sap/ushell/renderer/Renderer
  * @deprecated since 1.120.0
  */
 sap.ui.define([
    "sap/ushell/renderer/Renderer"
], function (Renderer) {
    "use strict";

    /**
     * This method MUST be called by the Unified Shell's container only, others MUST call <code>sap.ushell.Container.createRenderer("fiori2", true)</code>.
     *
     * @class The SAPUI5 component of SAP Fiori Launchpad renderer for the Unified Shell.
     * @extends sap.ui.core.UIComponent
     * @alias sap.ushell.renderers.fiori2.Renderer
     * @since 1.15.0
     * @public
     * @deprecated since 1.120.0 Please use {@link sap.ushell.services.Extension} instead.
     */
    const Fiori2Renderer = Renderer.extend("sap.ushell.renderers.fiori2.Renderer");

    /**
     * Creates and displays one or more HeaderItem controls according to the given control IDs and Shell states<br>
     * (see sap.ushell.renderers.fiori2.Renderer.LaunchpadState).<br><br>
     * The HeaderItem controls will be displayed on the left side of the Fiori Launchpad shell header according to the given display parameters.<br>
     * There can be up to three header items. If the number of existing header items plus the given ones exceeds 3,
     * then the operation fails and no new header items are created.<br>
     *
     * <b>Example:</b>
     * <pre>
     * var button1 = new sap.ushell.ui.shell.ShellHeadItem();
     * var button2 = new sap.ushell.ui.shell.ShellHeadItem();
     * var renderer = sap.ushell.Container.getRenderer("fiori2");
     * renderer.showHeaderItem ([button1.getId(), button2.getId()], false, ["home", "app"]);
     * </pre>
     *
     * @param {string|string[]} vIds Either ID or an array of IDs of headerItem controls to be added to the shell header.
     * @param {boolean} bCurrentState If <code>true</code> then the new created controls are added to the current rendered shell state.
     *   When the user navigates to another application (including the Home page) then the controls will be removed.
     *   If <code>false</code> then the controls are added to the LaunchPadState itself.
     * @param {string[]} aStates Valid only if bCurrentState is <code>false</code>.
     *   A list of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the controls are added.
     *   If no launchpad state is provided the controls are added in all states.
     *   @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.showHeaderItem = function (vIds, bCurrentState, aStates) {
        return Renderer.prototype.showHeaderItem.apply(this, arguments);
    };

    /**
     * Displays ToolAreaItems on the left side of the Fiori Launchpad shell, in the given launchpad states.
     *
     * <b>Example:</b>
     * <pre>
     * sap.ui.require(["sap/ushell/ui/shell/ToolAreaItem"], function (ToolAreaItem) {
     *     var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
     *         oToolAreaItem = new ToolAreaItem({ icon: "sap-icon://wrench" });
     *     renderer.showToolAreaItem(oToolAreaItem.getId(), false, ["home", "app"]);
     * });
     * </pre>
     *
     * @param {string|string[]} vIds A single ID or an array of IDs to add to the Tool Area.
     * @param {boolean} bCurrentState If <code>true</code>, add the items to the currently rendered shell.
     *   If <code>false</code>, add the items to the LaunchPadState itself,
     *   causing the items to be rendered every time the given states are active.
     * @param {string[]} aStates Only valid if bCurrentState is set to <code>false</code>.
     *   An array of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the controls are added.
     *   If no launchpad state is provided the items are added in all states.
     *   @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.showToolAreaItem = function (vIds, bCurrentState, aStates) {
        return Renderer.prototype.showToolAreaItem.apply(this, arguments);
    };

    /**
     * Displays action buttons in the User Actions Menu in the SAP Fiori launchpad, in the given launchpad states (LaunchpadState).
     * (see sap.ushell.renderers.fiori2.Renderer.LaunchpadState).</br>
     * If no launchpad state is provided the content is displayed in all states.</br>
     * The user actions menu is opened via the button on the right hand side of the shell header.</br>
     *
     * <b>Example:</b>
     * <pre>
     * var button1 = new sap.m.Button();
     * var renderer = sap.ushell.Container.getRenderer("fiori2");
     * renderer.showActionButton([button1.getId()], false, ["home", "app"]);
     * </pre>
     *
     * @param {string[]} aIds List of ID elements to that should be added to the User Actions Menu options bar.
     * @param {boolean} bCurrentState If true, add the created control to the current rendered shell state. When the user navigates to a
     *   different state, or to a different application, then the control is removed. If false, the control is added to the LaunchpadState.
     * @param {string[]} aStates List of the launchpad states (sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which to add the aIds.
     *   Valid only if bCurrentState is set to false.
     *   @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState.
     *   If no launchpad state is provided, the content is added in all states.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.showActionButton = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.showActionButton.apply(this, arguments);
    };

    /**
     * Displays FloatingActionButton on the bottom right corner of the Fiori launchpad, in the given launchpad states.
     * The FloatingActionButton is rendered in the bottom right corner of the shell.</br>
     * (see sap.ushell.renderers.fiori2.Renderer.LaunchpadState).</br>
     * If no launchpad state is provided the content is displayed in all states.</br>
     *
     * <b>Example:</b>
     * <pre>
     * var button1 = new sap.ushell.ui.shell.ShellFloatingAction();
     * var renderer = sap.ushell.Container.getRenderer("fiori2");
     * renderer.showFloatingActionButton([button1.getId()], true);
     * </pre>
     *
     * @param {string[]} aIds List of ID elements to add to the user actions menu.
     * @param {boolean} bCurrentState if true, add the current Buttons only to the current instance of the rendering of the shell.
     *   if false, add the Buttons to the LaunchPadState itself.
     * @param {string[]} aStates (only valid if bCurrentState is set to false) -
     *   list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the aIds.
     * @since 1.30
     * @public
     * @deprecated since 1.52. Support for the FloatingActionButton has been discontinued.
     */
    Fiori2Renderer.prototype.showFloatingActionButton = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.showFloatingActionButton.apply(this, arguments);
    };

    /**
     * Displays HeaderItems on the right side of the Fiori launchpad shell header, in the given launchpad states
     * (see sap.ushell.renderers.fiori2.Renderer.LaunchpadState).</br>
     * If no launchpad state is provided the content is displayed in all states.</br>
     * The shell header can display the user HeaderItem, and just one more HeaderItem.</br>
     * If this method is called when the right side of the header is full, this method will not do anything.</br>
     *
     * <b>Example:</b>
     * <pre>
     * var button1 = new sap.ushell.ui.shell.ShellHeadItem();
     * var renderer = sap.ushell.Container.getRenderer("fiori2");
     * renderer.showHeaderEndItem ([button1.getId()], false, ["home", "app"]);
     * </pre>
     *
     * @param {string[]} aIds List of ID elements to add to the shell header.
     * @param {boolean} bCurrentState if true, add the current HeaderItems only to the current instance of the rendering of the shell.
     *   if false, add the HeaderItems to the LaunchPadState itself.
     * @param {string[]} aStates (only valid if bCurrentState is set to false) -
     *   list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the aIds.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.showHeaderEndItem = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.showHeaderEndItem.apply(this, arguments);
    };

    /**
     * Sets the header visibility according to the given value and shell states.
     * (see sap.ushell.renderers.fiori2.Renderer.LaunchpadState).
     *
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     * oRenderer.setHeaderVisibility(false, false, ["home", "app"]);
     * </pre>
     *
     * @param {boolean} bVisible The visibility of the header<br>
     * @param {boolean} bCurrentState If <code>true</code> then the visibility is set only to the current rendered shell state.<br>
     *   When the user navigates to another application (including the Home page) then the visibility flag is reset.<br>
     *   If <code>false</code> then set the visibility according to the states provided in the aState parameter.<br>
     * @param {string[]} aStates (Valid only if bCurrentState is <code>false</code>)<br>
     *   A list of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the header visibility flag should be set.<br>
     *   If no launchpad state is provided the visibility flag is set for all states.
     *   @see LaunchpadState
     * @since 1.38
     * @public
     * @deprecated since 1.120.0 This functionality was discontinued
     */
    Fiori2Renderer.prototype.setHeaderVisibility = function (bVisible, bCurrentState, aStates) {
        return Renderer.prototype.setHeaderVisibility.apply(this, arguments);
    };

    /**
     * Displays one or more sub header controls according to the given control IDs and shell states.<br>
     * (see sap.ushell.renderers.fiori2.Renderer.LaunchpadState).<br><br>
     * A sub header is placed in a container, located directly below the main Fiori launchpad shell header.<br>
     *
     * <b>Example:</b>
     * <pre>
     * var bar = new sap.m.Bar({id: "testBar", contentLeft: [new sap.m.Button({text: "Test SubHeader Button",
     *   press: function () {
     *     sap.m.MessageToast.show("Pressed");
     *   }})
     * ]});
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     * oRenderer.showSubHeader([bar.getId()], false, ["home", "app"]);
     * </pre>
     *
     * @param {string[]} aIds Array of sub header control IDs to be added<br>
     * @param {boolean} bCurrentState If <code>true</code> then the new created controls are added only to the current rendered shell state.<br>
     *   When the user navigates to another application (including the Home page) then the controls will be removed.<br>
     *   If <code>false</code> then add the control to the LaunchPadState itself.<br>
     * @param {string[]} aStates (Valid only if bCurrentState is <code>false</code>)<br>
     *   A list of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the controls are added.<br>
     *   If no launchpad state is provided the controls are added in all states.
     *   @see LaunchpadState
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.showSubHeader = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.showSubHeader.apply(this, arguments);
    };

    /**
     * Displays the given sap.m.Bar as the footer of the Fiori launchpad shell.</br>
     * The footer will be displayed in all states. </br>
     *
     * <b>Example:</b>
     * <pre>
     * var bar = new sap.m.Bar({contentLeft: [new sap.m.Button({text: "Test Footer Button",
     *   press: function () {
     *     sap.m.MessageToast.show("Pressed");
     *   }})
     * ]});
     * var renderer = sap.ushell.Container.getRenderer("fiori2");
     * renderer.setFooter(bar);
     * </pre>
     *
     * @param {sap.m.Bar} oFooter - sap.m.Bar, the control to be added as the footer of the Fiori Launchpad
     * @since 1.30
     * @public
     * @deprecated since 1.120.0 Please use {@link #setShellFooter} instead.
     */
    Fiori2Renderer.prototype.setFooter = function (oFooter) {
        return Renderer.prototype.setFooter.apply(this, arguments);
    };

    /**
     * Creates and displays an SAPUI5 control as the footer of the Fiori launchpad shell.<br>
     * The footer will be displayed in all states. <br>
     * Previously created footer will be removed. <br>
     *
     * <b>For example, using the sap.m.Bar control:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
     *   oFooterControlProperties = {
     *     controlType : "sap.m.Bar",
     *     oControlProperties : {
     *       id: "testBar",
     *       contentLeft: [new sap.m.Button({
     *         text: "Test Footer Button",
     *         press: function () {
     *           sap.m.MessageToast.show("Pressed");
     *         }
     *       })]
     *     }
     *   };
     * oRenderer.setShellFooter(oFooterControlProperties);
     * </pre>
     *
     * @param {object} oParameters Contains the required parameters for creating and showing the new control object.
     * @param {string} oParameters.controlType The (class) name of the control type to create, for example: <code>sap.m.Bar</code>
     * @param {object} oParameters.oControlProperties The properties that will be passed to the created control, for example: <code>{id: "testBar"}</code>
     *
     * @returns {jQuery.Deferred.promise} jQuery.deferred.promise object that when resolved, returns the newly created control
     * @since 1.48
     * @public
     */
    Fiori2Renderer.prototype.setShellFooter = function (oParameters) {
        return Renderer.prototype.setShellFooter.apply(this, arguments);
    };

    /**
     * Creates and displays an SAPUI5 control as the footer of the Fiori launchpad shell.<br>
     * The footer will be displayed in all states. <br>
     * Previously created footer will be removed. <br>
     *
     * <b>For example, using the sap.m.Bar control:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     * oRenderer.setFooterControl("sap.m.Bar", {id: "testBar", contentLeft: [new sap.m.Button({text: "Test Footer Button",
     *   press: function () {
     *     sap.m.MessageToast.show("Pressed");
     *   }})
     * ]});
     * </pre>
     *
     * This function is marked for deprecation as of version 1.48.<br>
     * It will continue to work as expected as long as one of the following conditions apply:<br>
     *   1. The control instance is already created and its ID is included in the input parameter oControlProperties<br>
     *   2. The control type resource is already loaded
     *
     * @param {string} controlType The (class) name of the control type to create.<br>
     *   For example: <code>"sap.m.Bar"</code><br>
     * @param {object} oControlProperties The properties that will be passed to the created control.<br>
     *   For example: <code>{id: "testBar"}</code><br>
     * @returns {sap.ui.core.Control} The created control
     * @since 1.42
     * @deprecated since 1.48. Please use {@link #setShellFooter} instead.
     * @public
     */
    Fiori2Renderer.prototype.setFooterControl = function (controlType, oControlProperties) {
        return Renderer.prototype.setFooterControl.apply(this, arguments);
    };

    /**
     * Hide the given sap.ushell.ui.shell.ShellHeadItem from Fiori Launchpad, in the given launchpad states.
     * The removed control will not be destroyed.<br><br>
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @param {string[]} aIds the Ids of the sap.ushell.ui.shell.ShellHeadItem to remove.
     * @param {boolean} bCurrentState if true, remove the current control only from the current rendered shell state.
     * @param {string[]} aStates list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to remove the control.
     *   (Only valid if bCurrentState is set to false)
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is removed in all states.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.hideHeaderItem = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.hideHeaderItem.apply(this, arguments);
    };

    /**
     * Remove the given Tool Area Item from Fiori Launchpad, in the given launchpad states.
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @param {string|string[]} vIds A single ID or an array of IDs to remove from the Tool Area.
     * @param {boolean} bCurrentState If <code>true</code>, remove the items from the currently rendered shell.
     *   If <code>false</code>, remove the items from the LaunchPadState itself,
     *   causing the items to be removed every time the given states are active.
     * @param {string[]} aStates (only valid if bCurrentState is set to <code>false</code>) -
     *   An array of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) from which the controls are removed.
     *   If no launchpad state is provided the items are removed from all states.
     *   @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.removeToolAreaItem = function (vIds, bCurrentState, aStates) {
        return Renderer.prototype.removeToolAreaItem.apply(this, arguments);
    };

    /**
     * Hides an action button from the User Actions Menu in the SAP Fiori launchpad, in the given launchpad states (LaunchpadState).
     * The removed button will not be destroyed.<br><br>
     * This API is meant to be used for custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on standard launchpad elements, as this may interfere with the standard launchpad functionality.
     *
     * @param {string[]} aIds IDs of the button controls that should hidden.
     * @param {boolean} bCurrentState If true, removes the current control only from the current rendered shell state.
     * @param {string[]} aStates A list of the launchpad states in which to hide the control. Valid only if bCurrentState is set to false.
     *   @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState.
     *   If no launchpad state is provided, the content is hidden in all states.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.hideActionButton = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.hideActionButton.apply(this, arguments);
    };

    /**
     * Hide the given control from Fiori Launchpad, in the given launchpad states.
     * The removed control will not be destroyed.<br><br>
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @param {string[]} aIds the Ids of the controls to remove.
     * @param {boolean} bCurrentState if true, remove the current control only from the current rendered shell state.
     * @param {string[]} aStates list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to remove the control.
     *   (Only valid if bCurrentState is set to false)
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is removed in all states.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.hideLeftPaneContent = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.hideLeftPaneContent.apply(this, arguments);
    };

    /**
     * Hide the given sap.ushell.ui.shell.ShellFloatingAction from Fiori Launchpad, in the given launchpad states.
     * The removed control will not be destroyed.<br><br>
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @param {string[]} aIds the Ids of the sap.ushell.ui.shell.ShellFloatingAction to remove.
     * @param {boolean} bCurrentState if true, remove the current control only from the current rendered shell state.
     * @param {string[]} aStates list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to remove the control.
     *   (Only valid if bCurrentState is set to false)
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is removed in all states.
     * @since 1.30
     * @public
     * @deprecated since 1.52
     */
    Fiori2Renderer.prototype.hideFloatingActionButton = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.hideFloatingActionButton.apply(this, arguments);
    };

    /**
     * Hide the given sap.ushell.ui.shell.ShellHeadItem from Fiori Launchpad, in the given launchpad states.
     * The removed control will not be destroyed.<br><br>
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @param {string[]} aIds the Ids of the sap.ushell.ui.shell.ShellHeadItem to remove.
     * @param {boolean} bCurrentState if true, remove the current control only from the current rendered shell state.
     * @param {string[]} aStates list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to remove the control.
     *   (Only valid if bCurrentState is set to false)
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is removed in all states.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.hideHeaderEndItem = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.hideHeaderEndItem.apply(this, arguments);
    };

    /**
     * Hide the given control from the Fiori Launchpad sub header, in the given launchpad states.
     * The removed control will not be destroyed.<br><br>
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @param {string[]} aIds the Ids of the controls to remove.
     * @param {boolean} bCurrentState if true, remove the current control only from the current rendered shell state.
     * @param {string[]} aStates list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to remove the control.
     *   (Only valid if bCurrentState is set to false)
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is removed in all states.
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.hideSubHeader = function (aIds, bCurrentState, aStates) {
        return Renderer.prototype.hideSubHeader.apply(this, arguments);
    };

    /**
     * If exists, this method will remove the footer from the Fiori Launchpad.<br><br>
     * This API is meant to be used for implementing custom elements in the SAP Fiori launchpad.
     * We do not recommend using it on a standard launchpad element, as this may interfere with the standard launchpad functionality.
     *
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.removeFooter = function () {
        return Renderer.prototype.removeFooter.apply(this, arguments);
    };

    /**
     * This method returns the current state of the Viewport Container control.
     *
     * @returns {string} The current Viewport State.
     * @since 1.37
     * @public
     * @deprecated since 1.120.0 This functionality was discontinued
     */
    Fiori2Renderer.prototype.getCurrentViewportState = function () {
        return Renderer.prototype.getCurrentViewportState.apply(this, arguments);
    };

    /**
     * Creates and displays a sub header control in Fiori launchpad, in the given launchpad states.<br>
     * The new control is displayed in FLP UI according to the given display parameters.<br>
     * If a sub header already exists, the new created one will replace the existing one.<br><br>
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
     *     oAddSubHeaderProperties = {
     *         controlType : "sap.m.Bar",
     *         oControlProperties : {
     *             id: "testBar",
     *             contentLeft: [new sap.m.Button({
     *                 text: "Test SubHeader Button",
     *                 press: function () {
     *                     sap.m.MessageToast.show("Pressed");
     *                 }
     *             })
     *         },
     *         bIsVisible: true,
     *         bCurrentState: true
     *     };
     *
     * oRenderer.addShellSubHeader(oAddSubHeaderProperties);
     * </pre>
     *
     * @param {object} oParameters Contains the required parameters for creating and showing the new control object.
     * @param {string} oParameters.controlType The (class) name of the control type to create.
     * @param {object} oParameters.oControlProperties The properties that will be passed to the created control.
     * @param {boolean} oParameters.bIsVisible Specify whether to display the control.
     * @param {boolean} oParameters.bCurrentState If true, add the current control only to the current rendered shell state. Once the user
     * navigates to another app or back to the Home page, this control will be removed.
     * @param {string[]} oParameters.aStates (only valid if bCurrentState is set to false) - list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.
     *
     * @returns {jQuery.Deferred.promise} jQuery.Deferred.promise object that when resolved, returns the newly created control
     * @since 1.48
     * @public
     */
    Fiori2Renderer.prototype.addShellSubHeader = function (oParameters) {
        return Renderer.prototype.addShellSubHeader.apply(this, arguments);
    };

    /**
     * Creates and displays a sub header control in Fiori launchpad, in the given launchpad states.<br>
     * The new control is displayed in FLP UI according to the given display parameters.<br>
     * If a sub header already exists, the new created one will replace the existing one.<br><br>
     *
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     * oRenderer.addSubHeader("sap.m.Bar", {id: "testBar", contentLeft: [new sap.m.Button({text: "Test SubHeader Button",
     *   press: function () {
     *     sap.m.MessageToast.show("Pressed");
     *   }})
     * ]}, true, true);
     * </pre>
     *
     * This function is marked for deprecation as of version 1.48.<br>
     * It will continue to work as expected as long as one of the following conditions apply:<br>
     *   1. The control instance is already created and its ID is included in the input parameter oControlProperties<br>
     *   2. The control type resource is already loaded
     *
     * @param {string} controlType The (class) name of the control type to create.<br>
     *   For example: <code>"sap.m.Bar"</code><br>
     * @param {object} oControlProperties The properties that will be passed to the created control.<br>
     *   For example: <code>{id: "testBar"}</code><br>
     * @param {boolean} bIsVisible Specifies whether the sub header control is displayed after being created.<br>
     *   If <code>true</code> then the control is displayed according to parameters bCurrentState and aStates,<br>
     *   if <code>false</code> then the control is created but not displayed.<br>
     * @param {boolean} bCurrentState If <code>true</code> then the new created control is added to the current rendered shell state.<br>
     *   When the user navigates to another application (including the Home page) then the control will be removed.<br>
     *   If <code>false</code> then add the control to the LaunchPadState itself.<br>
     * @param {string[]} aStates (Valid only if bCurrentState is <code>false</code>)<br>
     *   A list of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the control is added.<br>
     *   If no launchpad state is provided the control is added in all states.
     *   @see LaunchpadState
     * @returns {object} The created control
     * @since 1.30
     * @deprecated since 1.48. Please use {@link #addShellSubHeader} instead.
     * @public
     */
    Fiori2Renderer.prototype.addSubHeader = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addSubHeader.apply(this, arguments);
    };

    /**
     * Creates an Action Button in Fiori launchpad, in the given launchpad states. </br>
     * The button will be displayed in the user actions menu, that is opened from the user button in the shell header.</br>
     *  <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
     *     oAddActionButtonProperties = {
     *         controlType : "sap.m.Button",
     *         oControlProperties : {
     *             id: "exampleButton",
     *             text: "Example Button",
     *             icon: "sap-icon://refresh",
     *             press: function () {
     *                 alert("Example Button was pressed!");
     *             }
     *         },
     *         bIsVisible: true,
     *         bCurrentState: true
     *     };
     * oRenderer.addUserAction(oAddActionButtonProperties);
     * </pre>
     *
     * @param {object} oParameters Contains the required parameters for creating and showing the new control object.
     * @param {string} oParameters.controlType The (class) name of the control type to create.<br>
     * @param {object} oParameters.oControlProperties The properties that will be passed to the created control.<br>
     * @param {boolean} oParameters.bIsVisible Specify whether to display the control.
     * @param {boolean} oParameters.bCurrentState If true, add the current control only to the current rendered shell state.
     * Once the user navigates to another app or back to the Home page, this control will be removed.
     * @param {string[]} oParameters.aStates (only valid if bCurrentState is set to false) - list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.
     * If no launchpad state is provided the content is added in all states. @see LaunchpadState
     *
     * @returns {jQuery.Deferred.promise} jQuery.Deferred.promise object that when resolved, returns the newly created control
     * @since 1.48
     * @public
     */
    Fiori2Renderer.prototype.addUserAction = function (oParameters) {
        return Renderer.prototype.addUserAction.apply(this, arguments);
    };

    /**
     * Creates an action button in the User Actions Menu in the SAP Fiori launchpad, in the given launchpad states (LaunchpadState).</br>
     *
     * <b>Example:</b>
     * <pre>
     * sap.ushell.Container.getRenderer("fiori2").addActionButton("sap.m.Button", {id: "testBtn2", text: "test button"}, true, true);
     * </pre>
     *
     * This function is marked for deprecation as of version 1.48.<br>
     * It will continue to work as expected as long as one of the following conditions apply:<br>
     *   1. The control instance is already created and its ID is included in the input parameter oControlProperties<br>
     *   2. The control type resource is already loaded
     *
     * @param {string} controlType The (class) name of the control type to create.
     * @param {object} oControlProperties The properties that will be passed to the created control.
     * @param {boolean} bIsVisible Specify whether to display the control. If true, the control is displayed (calls the showActionButton method)
     *   according to the bCurrentState and aStates parameters. If false, the control is created but not displayed
     *   (you can use showActionButton to display the control when needed).
     * @param {boolean} bCurrentState If true, add the current control only to the current rendered shell state.
     *   Once the user navigates to another app or back to the home page, this control will be removed.
     * @param {string[]} aStates List of the launchpad states (sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which to add the control.
     *   Valid only if bCurrentState is set to false.
     *   @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState
     *   If no launchpad state is provided, the content is added in all states.
     * @returns {sap.ui.core.Control} oItem - the created control
     * @since 1.30
     * @deprecated since 1.48. Please use {@link #addUserAction} instead.
     * @public
     */
    Fiori2Renderer.prototype.addActionButton = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addActionButton.apply(this, arguments);
    };

    /**
     * Creates a FloatingActionButton in Fiori launchpad, in the given launchpad states.</br>
     * The FloatingActionButton is rendered in the bottom right corner of the shell.</br>
     *
     * <b>Example:</b>
     * <pre>
     * sap.ushell.Container.getRenderer("fiori2").addFloatingActionButton("sap.ushell.ui.shell.ShellFloatingAction", {id: "testBtn"}, true, true);
     * </pre>
     *
     * @param {object} oParameters Contains the required parameters for creating and showing the new control object:<br>
     *  Properties:<br>
     *   - {string} controlType<br>
     *     The (class) name of the control type to create.<br>
     *   - {object} oControlProperties<br>
     *     The properties that will be passed to the created control.<br>
     *   - {boolean} bIsVisible<br>
     *     Specify whether to display the control.<br>
     *   - {boolean} bCurrentState<br>
     *     If true, add the current control only to the current rendered shell state.<br>
     *     Once the user navigates to another app or back to the Home page, this control will be removed.<br>
     *   - {string[]} aStates<br>
     *     (only valid if bCurrentState is set to false) - list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.<br>
     *
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is added in all states.
     * @returns {object} jQuery.deferred.promise object that when resolved, returns the newly created control
     * @since 1.48
     * @public
     * @deprecated since 1.52
     */
    Fiori2Renderer.prototype.addFloatingButton = function (oParameters) {
        return Renderer.prototype.addFloatingButton.apply(this, arguments);
    };

    /**
     * Creates a FloatingActionButton in Fiori launchpad, in the given launchpad states.</br>
     * The FloatingActionButton is rendered in the bottom right corner of the shell.</br>
     *
     * <b>Example:</b>
     * <pre>
     * sap.ushell.Container.getRenderer("fiori2").addFloatingActionButton("sap.ushell.ui.shell.ShellFloatingAction", {id: "testBtn"}, true, true);
     * </pre>
     *
     * This function is marked for deprecation as of version 1.48.<br>
     * It will continue to work as expected as long as one of the following conditions apply:<br>
     *   1. The control instance is already created and its ID is included in the input parameter oControlProperties<br>
     *   2. The control type resource is already loaded
     *
     * @param {string} controlType The (class) name of the control type to create.
     * @param {object} oControlProperties The properties that will be passed to the created control.
     * @param {boolean} bIsVisible Specify whether to display the control.
     * @param {boolean} bCurrentState If true, add the current control only to the current rendered shell state.
     *   Once the user navigates to another app or back to the Home page, this control will be removed.
     * @param {string[]} aStates (only valid if bCurrentState is set to false) -
     *   list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is added in all states.
     * @returns {object} oItem - the created control
     * @since 1.30
     * @deprecated since 1.48. Please use {@link #addFloatingButton} instead.
     * @public
     */
    Fiori2Renderer.prototype.addFloatingActionButton = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addFloatingActionButton.apply(this, arguments);
    };

    /**
     * Creates the Left Pane content in Fiori launchpad, in the given launchpad states.</br>
     *
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
     *     oSidePaneContentProperties = {
     *         controlType : "sap.m.Button",
     *         oControlProperties : {
     *             id: "testBtn",
     *             text: "Test Button"
     *         },
     *         bIsVisible: true,
     *         bCurrentState: true
     *     };
     *
     * oRenderer.addSidePaneContent(oSidePaneContentProperties);
     * </pre>
     *
     * @param {object} oParameters
     *      Contains the parameters for the control that should be added to the side pane
     * @param {string} oParameters.controlType
     *      The (class) name of the control type to create.
     * @param {object} oParameters.oControlProperties
     *      The properties that will be passed to the created control.
     * @param {boolean} oParameters.bIsVisible
     *      Specify whether to display the control.
     * @param {boolean} oParameters.bCurrentState
     *      If true, add the current control only to the current rendered shell state.
     *      Once the user navigates to another app or back to the Home page, this control will be removed.
     * @param {string[]} oParameters.aStates
     *      (only valid if bCurrentState is set to false) - list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.
     *      @see LaunchpadState
     *      If no launchpad state is provided the content is added in all states.
     *
     * @returns {jQuery.Deferred.promise} jQuery.Deferred.promise object that when resolved, returns the newly created control.
     *
     * @since 1.48
     * @public
     */
    Fiori2Renderer.prototype.addSidePaneContent = function (oParameters) {
        return Renderer.prototype.addSidePaneContent.apply(this, arguments);
    };

    /**
     * Creates the Left Pane content in Fiori launchpad, in the given launchpad states.</br>
     *
     * <b>Example:</b>
     * <pre>
     * sap.ushell.Container.getRenderer("fiori2").addLeftPaneContent("sap.m.Button", {id: "testBtn", text: "Test Button"}, true, true);
     * </pre>
     *
     * This function is marked for deprecation as of version 1.48.<br>
     * It will continue to work as expected as long as one of the following conditions apply:<br>
     *   1. The control instance is already created and its ID is included in the input parameter oControlProperties<br>
     *   2. The control type resource is already loaded
     *
     * @param {string} controlType The (class) name of the control type to create.
     * @param {object} oControlProperties The properties that will be passed to the created control.
     * @param {boolean} bIsVisible Specify whether to display the control.
     * @param {boolean} bCurrentState If true, add the current control only to the current rendered shell state.
     *   Once the user navigates to another app or back to the Home page, this control will be removed.
     * @param {string[]} aStates (only valid if bCurrentState is set to false) -
     *   list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is added in all states.
     * @returns {object} oItem - the created control
     * @since 1.30
     * @deprecated since 1.48. Please use {@link #addSidePaneContent} instead.
     * @public
     */
    Fiori2Renderer.prototype.addLeftPaneContent = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addLeftPaneContent.apply(this, arguments);
    };

    /**
     * Creates and displays an item in the header of Fiori launchpad, in the given launchpad states.<br>
     * The new header item will be displayed on the left-hand side of the Fiori Launchpad shell header, according to the given display parameters.<br>
     * The new header item will be added to the right of any existing header items. The header can contain a maximum of three header items.<br><br>
     *
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     *     oRenderer.addHeaderItem({
     *         id: "myTestButton",
     *         ariaLabel: resources.i18n.getText("testButton.label"),
     *         ariaHaspopup: "dialog",
     *         icon: "sap-icon://action-settings",
     *         tooltip: resources.i18n.getText("testButton.tooltip"),
     *         text: resources.i18n.getText("testButton.text"),
     *         press: controller.handleTestButtonPress
     *     }, true, true);
     * </pre>
     *
     * @param {string} [controlType] The (class) name of the control type to create.
     *   <b>Deprecated</b>: Since version 1.38.
     *   This parameter is no longer supported and can be omitted.
     * @param {object} oControlProperties The properties that will be passed to the created control.
     *   For example: <code>{id: "testButton"}</code><br>
     * @param {boolean} bIsVisible Specifies whether the header item control is displayed after being created.<br>
     *   If <code>true</code> then the control is displayed according to parameters bCurrentState and aStates.<br>
     *   If <code>false</code> then the control is created but not displayed.<br>
     * @param {boolean} bCurrentState If <code>true</code> then the new created control is added to the current rendered shell state.<br>
     *   When the user navigates to a different state including a different application then the control will be removed.<br>
     *   If <code>false</code> then add the control to the LaunchPadState itself.<br>
     * @param {string[]} aStates (Valid only if bCurrentState is <code>false</code>)<br>
     *   A list of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the control is added.<br>
     *   If no launchpad state is provided the control is added in all states.
     *   @see LaunchpadState
     * @returns {sap.ui.core.Control} The created control
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.addHeaderItem = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addHeaderItem.apply(this, arguments);
    };

    /**
     * Creates a ToolAreaItem  in Fiori Launchpad and adds it to the Tool Area, in the given launchpad states.
     * Once the item is added, the Tool Area is rendered on the left side on the Fiori Launchpad shell.
     *
     * <b>Example:</b>
     * <pre>
     * sap.ushell.Container.getRenderer("fiori2").addToolAreaItem({
     *   id: "testButton",
     *   icon: "sap-icon://documents",
     *   expandable: true,
     *   press: function (evt) {
     *     window.alert("Press" );
     *   },
     *   expand: function (evt) {
     *     // This function will be called on the press event of the "expand" button. The result of "expand" event in the UI must be determined by the developer
     *     window.alert("Expand" );
     *   }
     * }, true, false, ["home"]);
     * </pre>
     *
     * @param {object} oControlProperties The properties object that will be passed to the constructor of sap.ushell.ui.shell.ToolAreaItem control.
     *    @see sap.ushell.ui.shell.ToolAreaItem
     * @param {boolean} bIsVisible Specify whether to display the control.
     * @param {boolean} bCurrentState If <code>true</code>, add the item to the currently rendered shell.
     *    If <code>false</code>, add the item to the given LaunchPadStates
     *    This causes the items to be rendered every time the given states are active.
     * @param {string[]} aStates (only valid if bCurrentState is set to <code>false</code>) -
     *    An array of shell states (i.e. sap.ushell.renderers.fiori2.Renderer.LaunchpadState) in which the controls are added.
     *    If no launchpad state is provided the items are added in all states.
     *    @see sap.ushell.renderers.fiori2.Renderer.LaunchpadState.
     * @returns {sap.ui.core.Control} the added control
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.addToolAreaItem = function (oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addToolAreaItem.apply(this, arguments);
    };

    /**
     * Creates and displays a shell header icon in Fiori launchpad, in the given launchpad states.</br>
     * The icon is displayed in the right side of the Fiori Launchpad shell header or in an overflow menu.</br>
     * The text property is mandatory as it might be used in the overflow menu.</br>
     * The tooltip property must not have the same text as the text property, as this causes accessibility issues if the item is in the overflow menu.</br>
     * If no tooltip is provided, the text property is shown as tooltip when the item is not in the overflow menu.</br>
     *
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     *
     *     // Create an icon button that opens a dialog
     *     oRenderer.addHeaderEndItem({
     *         id: "myTestButton",
     *         icon: "sap-icon://action-settings",
     *         tooltip: resources.i18n.getText("testButton.tooltip"),
     *         text: resources.i18n.getText("testButton.text"),
     *         ariaLabel: resources.i18n.getText("testButton.ariaLabel"),
     *         ariaHaspopup: "dialog",
     *         press: [myController.handleTestButtonPress, myController]
     *     }, true);
     *
     *     // Create a temporary link
     *     oRenderer.addHeaderEndItem({
     *         id: "myTestLink",
     *         ariaLabel: resources.i18n.getText("testLink.label"),
     *         target: "#MyTestApplication-show",
     *         icon: "sap-icon://overflow"
     *     }, true, true);
     * </pre>
     *
     * @param {string} controlType The (class) name of the control type to create.
     *   <b>Deprecated</b>: Since version 1.38.
     *   This parameter is no longer supported and can be omitted.
     * @param {object} oControlProperties The properties that will be passed to the created control.
     *   The object may contain the following properties:
     *   <ul>
     *     <li>{string} [id] - The ID of the object.<br>
     *     <li>{string} icon - The button icon source.<br>
     *     <li>{string} [text] - The button text. It is only rendered in the overflow popover but not in the shell header.<br>
     *     <li>{string} [target] - target URI for a navigation link.<br>
     *     <li>{string} [ariaLabel] - Accessibility: aria-label attribute.<br>
     *     <li>{string} [ariaHaspopup] - Accessibility: aria-haspopup attribute.<br>
     *     <li>{Function} [press] - A function to be called when the button is depressed.<br>
     *   </ul>
     * @param {boolean} bIsVisible Specify whether to display the control.
     * @param {boolean} bCurrentState If true, add the current control only to the current rendered shell state.
     *   Once the user navigates to another app or back to the Home page, this control will be removed.
     * @param {string[]} aStates (only valid if bCurrentState is set to false) -
     *   list of the sap.ushell.renderers.fiori2.Renderer.LaunchpadState in which to add the control.
     *   @see LaunchpadState
     *   If no launchpad state is provided the content is added in all states.
     * @returns {sap.ui.core.Control} oItem - the created control
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.addHeaderEndItem = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
        return Renderer.prototype.addHeaderEndItem.apply(this, arguments);
    };

    /**
     * Adds the given sap.ui.core.Control to the EndUserFeedback dialog.</br>
     * The EndUserFeedback dialog is opened via the user actions menu in the Fiori Launchpad shell header.
     *
     * @param {object} oCustomUIContent The control to be added to the EndUserFeedback dialog.
     * @param {boolean} bShowCustomUIContent Specify whether to display the control.
     * @since 1.30
     * @deprecated since 1.93
     * @public
     */
    Fiori2Renderer.prototype.addEndUserFeedbackCustomUI = function (oCustomUIContent, bShowCustomUIContent) {
        return Renderer.prototype.addEndUserFeedbackCustomUI.apply(this, arguments);
    };

    /**
     * Adds an entry to the User Preferences dialog box including the UI control that appears when the user clicks the new entry,
     * and handling of User Preferences actions such as SAVE and CANCEL.
     *
     * <b>Example:</b>
     * <pre>
     * var oRenderer = sap.ushell.Container.getRenderer("fiori2");
     * var oEntry = {
     *   title: "title",
     *   value: function() {
     *       return jQuery.Deferred().resolve("entryTitleToBeDisplayed");
     *   },
     *   content: function() {
     *       return jQuery.Deferred().resolve(new sap.m.Button("userPrefEntryButton", {text: "Button"}));
     *   },
     *   onSave: function() {
     *       return jQuery.Deferred().resolve();
     *   }
     * };
     * oRenderer.addUserPreferencesEntry(oEntry);
     * </pre>
     *
     * @param {object} entryObject The data of the new added User Preference entry.
     * @param {string} entryObject.entryHelpID (Optional) - The ID of the object.
     * @param {string} entryObject.title - The title of the entry to be presented in the list in the User Preferences dialog box. We recommend using a string from the translation bundle.
     * @param {string|function} value - A string to be presented as the value of the entry OR a function to be called which returns a {jQuery.Deferred.promise} object.
     * @param {function} entryObject.content - A function to be called that returns a {jQuery.Deferred.promise} object which consists of a
     * {sap.ui.core.Control} to be displayed in a follow-on dialog box. A SAPUI5 view instance can also be returned. The function is called on each time the user opens the User Preferences dialog box.
     * @param {function} entryObject.onSave - A function to be called which returns a {jQuery.Deferred.promise} object when the user clicks "save" in the User Preferences dialog box.
     * If an error occurs, pass the error message via the {jQuery.Deferred.promise} object. Errors are displayed in the log.
     * @param {function} entryObject.onCancel - A function to be called that closes the User Preferences dialog box without saving any changes.
     * @param {boolean} entryObject.provideEmptyWrapper - Experimental. Set this value to true if you want that your content is displayed without the standard header.
     *
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.addUserPreferencesEntry = function (entryObject) {
        return Renderer.prototype.addUserPreferencesEntry.apply(this, arguments);
    };

    /**
     * Sets the title in the Fiori Launchpad shell header.
     *
     * @param {string} sTitle The title to be displayed in the Fiori Launchpad shell header
     * @since 1.30
     * @public
     * @deprecated since 1.120.0 Please use {@link sap.ushell.ui5service.ShellUIService#getTitle} instead.
     */
    Fiori2Renderer.prototype.setHeaderTitle = function (sTitle) {
        return Renderer.prototype.setHeaderTitle.apply(this, arguments);
    };

    /**
     * Sets the visibility of the left pane in the Fiori Launchpad shell, in the given launchpad state @see LaunchpadState
     *
     * @param {string} sLaunchpadState LaunchpadState in which to show/hide the left pane
     * @param {boolean} bVisible specify whether to display the left pane or not
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.setLeftPaneVisibility = function (sLaunchpadState, bVisible) {
        return Renderer.prototype.setLeftPaneVisibility.apply(this, arguments);
    };

    /**
     * Sets the ToolArea visibility
     *
     * @param {string} [sLaunchpadState] - LaunchpadState in which to show/hide the ToolArea @see LaunchpadState
     * @param {boolean} [bVisible] - specifies whether to display the ToolArea or not
     * @public
     */
    Fiori2Renderer.prototype.showToolArea = function (sLaunchpadState, bVisible) {
        return Renderer.prototype.showToolArea.apply(this, arguments);
    };

    /**
     * The launchpad states that can be passed as a parameter.</br>
     *
     * <b>Values:</b>
     *   App - launchpad state when running a Fiori app</br>
     *   Home - launchpad state when the home page is open</br>
     *
     * @since 1.30
     * @public
     */
    Fiori2Renderer.prototype.LaunchpadState = Renderer.prototype.LaunchpadState;

    return Fiori2Renderer;
}, /* bExport= */ true);
