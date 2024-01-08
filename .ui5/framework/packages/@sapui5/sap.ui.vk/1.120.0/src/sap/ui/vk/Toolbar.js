/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.Toolbar.
sap.ui.define([
	"./library",
	"./ToolbarRenderer",
	"./getResourceBundle",
	"sap/ui/core/Control",
	"sap/ui/core/Core",
	"sap/m/library",
	"sap/m/Title",
	"sap/m/Button",
	"sap/m/ToggleButton",
	"sap/m/ToolbarSpacer",
	"sap/m/ToolbarSeparator",
	"sap/m/Toolbar"
], function(
	vkLibrary,
	ToolbarRenderer,
	getResourceBundle,
	Control,
	core,
	mobileLibrary,
	Title,
	Button,
	ToggleButton,
	ToolbarSpacer,
	ToolbarSeparator,
	SapMToolbar
) {
	"use strict";

	var ToolbarDesign = mobileLibrary.ToolbarDesign;
	var ButtonType = mobileLibrary.ButtonType;

	/**
	 * Constructor for a new Toolbar.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Provides buttons to hide or show certain sap.ui.vk controls.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.120.0
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.Toolbar
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @since 1.32.0
	 */
	var Toolbar = Control.extend("sap.ui.vk.Toolbar", /** @lends sap.ui.vk.Toolbar.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				/**
				 * Used to set the title of the Toolbar
				 * @private
				 */
				title: {
					type: "string",
					group: "Appearance",
					defaultValue: ""
				}
			},
			events: {},
			associations: {
				/**
				 * A toolbar instance is associated with an instance of the Viewer
				 *
				 * @private
				 */
				viewer: {
					type: "sap.ui.vk.Viewer",
					multiple: false
				}
			},
			aggregations: {
				/**
				 * Toolbar content, this can be used to add/remove buttons and other SAP UI5 controls to the toolbar
				 */
				content: {
					type: "sap.ui.core.Control",
					multiple: true,
					forwarding: {
						getter: "_getToolbar",
						aggregation: "content",
						forwardBinding: true
					}
				},
				_toolbar: {
					type: "sap.m.Toolbar",
					multiple: false,
					visibility: "hidden"
				},
				_helpButton: {
					type: "sap.m.Button",
					multiple: false,
					visibility: "hidden"
				},
				_stepNavigationButton: {
					type: "sap.m.ToggleButton",
					multiple: false,
					visibility: "hidden"
				},
				_sceneTreeButton: {
					type: "sap.m.ToggleButton",
					multiple: false,
					visibility: "hidden"
				},
				_enterFullScreenButton: {
					type: "sap.m.ToggleButton",
					multiple: false,
					visibility: "hidden"
				},
				_exitFullScreenButton: {
					type: "sap.m.Button",
					multiple: false,
					visibility: "hidden"
				},
				_toolbarTitle: {
					type: "sap.m.Title",
					multiple: false,
					visibility: "hidden"
				}
			}
		}
	});

	Toolbar.prototype._getToolbar = function() {
		return this._toolbar;
	};

	/*
	 * Toggles the step navigation control visibility and updates its button
	 */
	Toolbar.prototype._onSceneTree = function() {
		this.oViewer = core.byId(this.getViewer());
		if (this.oViewer != null) {
			this.oViewer._componentsState.sceneTree.userInteractionShow = this._sceneTreeButton.getPressed();
			this.oViewer.setShowSceneTree(this.oViewer._componentsState.sceneTree.userInteractionShow);
		}
	};

	Toolbar.prototype._onStepNavigation = function() {
		this.oViewer = core.byId(this.getViewer());
		if (this.oViewer != null) {
			this.oViewer._componentsState.stepNavigation.userInteractionShow = this._stepNavigationButton.getPressed();
			this.oViewer.setShowStepNavigation(this.oViewer._componentsState.stepNavigation.userInteractionShow);
		}
	};

	Toolbar.prototype._onFullScreen = function() {
		this.oViewer = core.byId(this.getViewer());
		if (this.oViewer != null) {
			var newStateFullScreenButton = this._enterFullScreenButton.getPressed();
			this.oViewer.activateFullScreenMode(newStateFullScreenButton);
		}
	};

	Toolbar.prototype._fullScreenHandler = function(event) {
		var bFull = event.mParameters.isFullScreen;
		this._enterFullScreenButton.setPressed(bFull);

		if (bFull) {
			this._enterFullScreenButton.setIcon("sap-icon://exit-full-screen");
		} else {
			this._enterFullScreenButton.setIcon("sap-icon://full-screen");
		}
	};

	Toolbar.prototype.init = function() {
		if (Control.prototype.init) {
			Control.prototype.init.apply(this);
		}

		var _helpButton = new Button({
			icon: "sap-icon://sys-help",
			type: ButtonType.Transparent,
			tooltip: getResourceBundle().getText("VIEWER_HELPBUTTONTOOLTIP")
		});
		this.setAggregation("_helpButton", _helpButton);

		this._stepNavigationButton = new ToggleButton({
			icon: "sap-icon://step",
			type: ButtonType.Transparent,
			enabled: false,
			tooltip: getResourceBundle().getText("STEP_NAV_MENUBUTTONTOOLTIP"),
			press: this._onStepNavigation.bind(this)
		});
		this.setAggregation("_stepNavigationButton", this._stepNavigationButton);

		this._sceneTreeButton = new ToggleButton({
			icon: "sap-icon://tree",
			type: ButtonType.Transparent,
			tooltip: getResourceBundle().getText("SCENETREE_MENUBUTTONTOOLTIP"),
			press: this._onSceneTree.bind(this)
		});
		this.setAggregation("_sceneTreeButton", this._sceneTreeButton);

		this._toolbarTitle = new Title();
		this.setAggregation("_toolbarTitle", this._toolbarTitle);


		this._enterFullScreenButton = new ToggleButton({
			icon: "sap-icon://full-screen",
			type: ButtonType.Transparent,
			tooltip: getResourceBundle().getText("VIEWER_FULLSCREENBUTTONTOOLTIP"),
			press: this._onFullScreen.bind(this)
		});
		this.setAggregation("_enterFullScreenButton", this._enterFullScreenButton);

		var _exitFullScreenButton = new Button({
			icon: "sap-icon://exit-full-screen",
			type: ButtonType.Transparent,
			tooltip: getResourceBundle().getText("VIEWER_FULLSCREENBUTTONTOOLTIP")
		});
		this.setAggregation("_exitFullScreenButton", _exitFullScreenButton);

		var toolbarContent = [
			new ToolbarSpacer(),
			this._toolbarTitle,
			new ToolbarSpacer(),
			new ToolbarSeparator(),
			this._sceneTreeButton,
			new ToolbarSeparator(),
			this._stepNavigationButton,
			new ToolbarSeparator(),
			this._enterFullScreenButton
		];

		this._toolbar = new SapMToolbar({
			design: ToolbarDesign.Solid,
			content: toolbarContent
		});
		this.setAggregation("_toolbar", this._toolbar, true);
	};

	Toolbar.prototype.exit = function() {
		this.oViewer = core.byId(this.getViewer());
		if (this.oViewer) {
			this.oViewer.detachFullScreen(this._fullScreenHandler.bind(this));
		}
	};

	Toolbar.prototype.onBeforeRendering = function() {
		this._toolbar.setVisible(true);
		this._toolbarTitle.setText(this.getTitle());
	};

	Toolbar.prototype.refresh = function() {
		this.oViewer = core.byId(this.getViewer());
		this._stepNavigationButton.setPressed(this.oViewer.getShowStepNavigation());
		this._stepNavigationButton.setEnabled(this.oViewer.getEnableStepNavigation());
		this._sceneTreeButton.setPressed(this.oViewer.getShowSceneTree());
		this._sceneTreeButton.setEnabled(this.oViewer.getEnableSceneTree());

		this.oViewer.attachFullScreen(this._fullScreenHandler.bind(this));
		return true;
	};

	Toolbar.prototype.onAfterRendering = function() {
		this.refresh();
	};

	return Toolbar;

});
