/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.PointCloudSelectionTool
sap.ui.define([
	"./Tool",
	"./PointCloudSelectionToolHandler",
	"./PointCloudSelectionToolGizmo"
], function(
	Tool,
	PointCloudSelectionToolHandler,
	PointCloudSelectionToolGizmo
) {
	"use strict";

	/**
	 * Constructor for a PointCloudSelectionTool.
	 *
	 * @class
	 * Tool used to select points

	 * @param {string} [sId] ID of the new tool instance. <code>sId</code>is generated automatically if no non-empty ID is given.
	 *                       Note: this can be omitted, regardless of whether <code>mSettings</code> will be provided or not.
	 * @param {object} [mSettings] An optional map/JSON object with initial property values, aggregated objects etc. for the new tool instance.
	 * @public
	 * @author SAP SE
	 * @version 1.120.0
	 * @extends sap.ui.vk.tools.Tool
	 * @alias sap.ui.vk.tools.PointCloudSelectionTool
	 * @experimental Since 1.118.0 This class is experimental and might be modified or removed in future versions.
	 */
	const PointCloudSelectionTool = Tool.extend("sap.ui.vk.tools.PointCloudSelectionTool", /** @lends sap.ui.vk.tools.PointCloudSelectionTool.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			properties: {
				selectionColor: {
					type: "float[]",
					defaultValue: [0, 1, 0, 1]
				}
			},
			events: {
				groupAdded: {
					group: "sap.ui.vk.threejs.PointCloudGroup"
				},
				groupRemoved: {
					group: "sap.ui.vk.threejs.PointCloudGroup"
				},
				currentGroupChanged: {
					group: "sap.ui.vk.threejs.PointCloudGroup"
				}
			}
		},

		constructor: function(sId, mSettings) {
			Tool.apply(this, arguments);

			// Configure dependencies
			this._viewport = null;
			this._handler = new PointCloudSelectionToolHandler(this);
			this._gizmo = null;
		}
	});

	PointCloudSelectionTool.prototype.init = function() {
		if (Tool.prototype.init) {
			Tool.prototype.init.call(this);
		}

		// set footprint for tool
		this.setFootprint(["sap.ui.vk.threejs.Viewport"]);

		this.setAggregation("gizmo", new PointCloudSelectionToolGizmo());
	};

	// Override the active property setter so that we execute activation / deactivation code at the same time
	PointCloudSelectionTool.prototype.setActive = function(value, activeViewport, gizmoContainer) {
		Tool.prototype.setActive.call(this, value, activeViewport, gizmoContainer);

		if (this._viewport) {
			if (value) {
				this._gizmo = this.getGizmo();
				this._gizmo.show(this._viewport, this);

				this._addLocoHandler();
			} else {
				this._removeLocoHandler();

				if (this._gizmo) {
					this._gizmo.hide();
					this._gizmo = null;
				}
			}
		}

		return this;
	};

	PointCloudSelectionTool.prototype.getGroups = function() {
		return this.getGizmo()._groups;
	};

	PointCloudSelectionTool.prototype.addGroup = function(settings) {
		return this.getGizmo().addGroup(settings);
	};

	PointCloudSelectionTool.prototype.removeGroup = function(group) {
		return this.getGizmo().removeGroup(group);
	};

	PointCloudSelectionTool.prototype.clearGroups = function() {
		this.getGizmo().clearGroups();
	};

	PointCloudSelectionTool.prototype.getCurrentGroup = function() {
		return this.getGizmo().getCurrentGroup();
	};

	PointCloudSelectionTool.prototype.previousGroup = function() {
		return this.getGizmo()._previousGroup();
	};

	PointCloudSelectionTool.prototype.nextGroup = function() {
		return this.getGizmo()._nextGroup();
	};

	PointCloudSelectionTool.prototype.changeCurrentGroupType = function(additive) {
		this.getGizmo()._changeCurrentGroupType(additive);
	};

	PointCloudSelectionTool.prototype.isCurrentGroupAdditive = function() {
		return this.getGizmo()._isCurrentGroupAdditive();
	};

	/** MOVE TO BASE
	 * Queues a command for execution during the rendering cycle. All gesture operations should be called using this method.
	 *
	 * @param {function} command The command to be executed.
	 * @returns {this} <code>this</code> to allow method chaining.
	 * @public
	 */
	PointCloudSelectionTool.prototype.queueCommand = function(command) {
		if (this._addLocoHandler()) {
			if (this.isViewportType("sap.ui.vk.threejs.Viewport")) {
				command();
			}
		}
		return this;
	};

	return PointCloudSelectionTool;
});
