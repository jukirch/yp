/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.PointCloudSelectionToolHandler
sap.ui.define([
	"sap/ui/base/EventProvider",
	"../thirdparty/three"
], function(
	EventProvider,
	THREE
) {
	"use strict";

	const PointCloudSelectionToolHandler = EventProvider.extend("sap.ui.vk.tools.PointCloudSelectionToolHandler", {
		metadata: {
			library: "sap.ui.vk"
		},
		constructor: function(tool) {
			this._priority = 10; // the priority of the handler
			this._tool = tool;
			this._gizmo = tool.getGizmo();
			this._rect = null;
			this._rayCaster = new THREE.Raycaster();
			// this._rayCaster.linePrecision = 0.2;
			this._handleIndex = -1;
			this._handleAxis = new THREE.Vector3();
			this._gizmoOrigin = new THREE.Vector3();
			this._gizmoScale = 1;
			this._matrixOrigin = new THREE.Matrix4();
			this._rotationOrigin = new THREE.Matrix4();
			this._mouse = new THREE.Vector2();
			this._mouseOrigin = new THREE.Vector2();
		}
	});

	PointCloudSelectionToolHandler.prototype._updateMouse = function(event) {
		const viewport = this.getViewport();
		const size = viewport.getRenderer().getSize(new THREE.Vector2());
		this._mouse.x = ((event.x - this._rect.x) / size.width) * 2 - 1;
		this._mouse.y = ((event.y - this._rect.y) / size.height) * -2 + 1;
		this._rayCaster.setFromCamera(this._mouse, viewport.getCamera().getCameraRef());
	};

	PointCloudSelectionToolHandler.prototype._updateHandles = function(event, hoverMode) {
		this._handleIndex = -1;
		if (event.n === 1 || (event.event && event.event.type === "contextmenu")) {
			for (let i = 0, l = this._gizmo.getGizmoCount(); i < l; i++) {
				const touchObj = this._gizmo.getTouchObject(i);
				const intersects = this._rayCaster.intersectObject(touchObj, true);
				if (intersects.length > 0) {
					this._handleIndex = touchObj.children.indexOf(intersects[0].object);
					if (this._handleIndex >= 0) {
						this._gizmoOrigin.setFromMatrixPosition(touchObj.matrixWorld);
						this._matrixOrigin.copy(touchObj.matrixWorld);
						this._gizmoScale = touchObj.scale.x;
						this._rotationOrigin.extractRotation(touchObj.matrixWorld);
						if (this._handleIndex < 3) { // arrow
							this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, this._handleIndex).normalize();
						} else if (this._handleIndex < 6) { // plane
							this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, this._handleIndex - 3).normalize();
						} else if (this._handleIndex < 9) { // plane
							this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, this._handleIndex - 6).normalize();
						} else if (this._handleIndex < 15) {
							this._handleAxis.setFromMatrixColumn(touchObj.matrixWorld, (this._handleIndex - 9) >> 1).normalize();
							if (this._handleIndex & 1) {
								this._handleAxis.multiplyScalar(-1);
							}
						}
					}
				}
			}
		}

		this._gizmo.highlightHandle(this._handleIndex, hoverMode || this._handleIndex === -1);
	};

	PointCloudSelectionToolHandler.prototype.hover = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, true);
			event.handled |= this._handleIndex >= 0;
		}
	};

	PointCloudSelectionToolHandler.prototype.click = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, true);
			const hit = this.getViewport().hitTest(event.x - this._rect.x, event.y - this._rect.y);
			if (hit) {
				if (this._gizmo.getCurrentGroup()) {
					this._gizmo._setGroupPosition(hit.point, event.event.shiftKey);
				} else {
					this._gizmo.addGroup({ position: hit.point });
				}
			}
			event.handled = true;
		}
	};

	const delta = new THREE.Vector3();

	PointCloudSelectionToolHandler.prototype._getAxisOffset = function() {
		const ray = this._rayCaster.ray;
		const dir = this._handleAxis.clone().cross(ray.direction).cross(ray.direction).normalize();
		delta.copy(ray.origin).sub(this._gizmoOrigin);
		return dir.dot(delta) / dir.dot(this._handleAxis);
	};

	PointCloudSelectionToolHandler.prototype._getPlaneOffset = function() {
		const ray = this._rayCaster.ray;
		delta.copy(this._gizmoOrigin).sub(ray.origin);
		const dist = this._handleAxis.dot(delta) / this._handleAxis.dot(ray.direction);
		return ray.direction.clone().multiplyScalar(dist).sub(delta);
	};

	PointCloudSelectionToolHandler.prototype._getMouseAngle = function() {
		const ray = this._rayCaster.ray;
		const delta = this._rotationPoint.clone().sub(ray.origin);
		const dist = this._rotationAxis.dot(delta) / this._rotationAxis.dot(ray.direction);
		const mouseDirection = ray.direction.clone().multiplyScalar(dist).sub(delta).normalize();
		return Math.atan2(mouseDirection.dot(this._axis2), mouseDirection.dot(this._axis1));
	};

	PointCloudSelectionToolHandler.prototype.beginGesture = function(event) {
		if (this._inside(event) && !this._gesture) {
			this._updateMouse(event);
			this._updateHandles(event, false);
			if (this._handleIndex >= 0) {
				event.handled = true;
				this._gesture = true;
				this._mouseOrigin.copy(event);
				this._gizmo.beginGesture();

				if (this._handleIndex < 3 || (this._handleIndex >= 9 && this._handleIndex < 15)) { // axis
					this._dragOrigin = this._getAxisOffset();
				} else if (this._handleIndex < 6) { // plane
					this._dragOrigin = this._getPlaneOffset();
				} else if (this._handleIndex < 9) {
					this._axis1 = new THREE.Vector3().setFromMatrixColumn(this._matrixOrigin, (this._handleIndex + 1) % 3).normalize();
					this._axis2 = new THREE.Vector3().setFromMatrixColumn(this._matrixOrigin, (this._handleIndex + 2) % 3).normalize();
					this._rotationAxis = new THREE.Vector3().crossVectors(this._axis1, this._axis2).normalize();
					this._rotationPoint = new THREE.Vector3().setFromMatrixPosition(this._matrixOrigin);
					if (Math.abs(this._rayCaster.ray.direction.dot(this._rotationAxis)) < Math.cos(Math.PI * 85 / 180)) { // |90° - angle| < 5°
						const matCamera = this.getViewport().getCamera().getCameraRef().matrixWorld;
						this._axis1.setFromMatrixColumn(matCamera, 0).normalize();
						this._axis2.setFromMatrixColumn(matCamera, 1).normalize();
						this._rotationAxis.setFromMatrixColumn(matCamera, 2).normalize();
					}

					// calculate start angle
					this._startAngle = this._getMouseAngle();
				}
			}
		}
	};

	PointCloudSelectionToolHandler.prototype.move = function(event) {
		if (this._gesture) {
			event.handled = true;
			this._updateMouse(event);

			if (this._handleIndex < 3) { // axis
				if (isFinite(this._dragOrigin)) {
					this._gizmo._setOffset(this._handleAxis.clone().multiplyScalar(this._getAxisOffset() - this._dragOrigin));
				}
			} else if (this._handleIndex < 6) { // plane
				if (isFinite(this._dragOrigin.x) && isFinite(this._dragOrigin.y) && isFinite(this._dragOrigin.z)) {
					this._gizmo._setOffset(this._getPlaneOffset().sub(this._dragOrigin));
				}
			} else if (this._handleIndex < 9) { // rotation handles
				const deltaAngle = this._getMouseAngle() - this._startAngle;
				if (isFinite(deltaAngle)) {
					this._gizmo._setRotationAxisAngle(this._handleIndex - 6, deltaAngle);
				}
			} else if (this._handleIndex < 15) { // box handles
				if (isFinite(this._dragOrigin)) {
					this._gizmo._setSize(this._handleIndex - 9, this._getAxisOffset() - this._dragOrigin, this._handleAxis,
						sap.ui.Device.os.macintosh ? event.event.metaKey : event.event.ctrlKey, event.event.shiftKey);
				}
			}
		}
	};

	PointCloudSelectionToolHandler.prototype.endGesture = function(event) {
		if (this._gesture) {
			this._gesture = false;
			event.handled = true;
			this._updateMouse(event);

			this._gizmo.endGesture();
			this._dragOrigin = undefined;
			this._updateHandles(event, true);
		}
	};

	PointCloudSelectionToolHandler.prototype.getViewport = function() {
		return this._tool._viewport;
	};

	// GENERALIZE THIS FUNCTION
	PointCloudSelectionToolHandler.prototype._getOffset = function(obj) {
		const rectangle = obj.getBoundingClientRect();
		return {
			x: rectangle.left + window.scrollX,
			y: rectangle.top + window.scrollY
		};
	};

	// GENERALIZE THIS FUNCTION
	PointCloudSelectionToolHandler.prototype._inside = function(event) {
		const id = this._tool._viewport.getIdForLabel();
		const domobj = document.getElementById(id);
		if (domobj == null) {
			return false;
		}

		const offset = this._getOffset(domobj);
		this._rect = {
			x: offset.x,
			y: offset.y,
			w: domobj.offsetWidth,
			h: domobj.offsetHeight
		};

		return (event.x >= this._rect.x && event.x <= this._rect.x + this._rect.w && event.y >= this._rect.y && event.y <= this._rect.y + this._rect.h);
	};

	return PointCloudSelectionToolHandler;
});
