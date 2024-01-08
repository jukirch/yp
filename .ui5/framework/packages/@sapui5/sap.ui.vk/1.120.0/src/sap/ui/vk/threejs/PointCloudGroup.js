/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define([
	"../thirdparty/three"
], function(
	THREE
) {
	"use strict";

	/**
	 * Constructor for a PointCloudGroup.
	 *
	 * @class
	 * @classdesc A class for a point cloud group object.
	 *
	 * @param {object} [settings] A JSON-like object.
	 * @param {any} [settings.position] A point cloud group position.
	 * @param {any} [settings.quaternion] A point cloud group rotation quaternion.
	 * @param {any} [settings.size] A point cloud group size.
	 * @param {any} [settings.color] A point cloud group color.
	 *
	 * @abstract
	 * @private
	 * @author SAP SE
	 * @version 1.120.0
	 * @alias sap.ui.vk.threejs.PointCloudGroup
	 * @experimental Since 1.118.0 This class is experimental and might be modified or removed in future versions.
	 */
	const PointCloudGroup = function(settings) {
		this._position = new THREE.Vector3();
		this._quaternion = new THREE.Quaternion();
		this._size = new THREE.Vector3();
		this._color = new THREE.Vector4();
		setProperty(this._position, settings.position);
		setProperty(this._quaternion, settings.quaternion);
		setProperty(this._size, settings.size);
		setProperty(this._color, settings.color);
	};

	function setProperty(property, setting) {
		if (setting != null) {
			if (property.constructor === setting.constructor) {
				property.copy(setting);
			} else if (Array.isArray(setting)) {
				property.fromArray(setting);
			} else if (typeof setting === "number") {
				property.setScalar(setting);
			}
		}
	}

	PointCloudGroup.prototype.getMatrix = function() {
		return new THREE.Matrix4().compose(this._position, this._quaternion, this._size);
	};

	PointCloudGroup.prototype.getPosition = function() {
		return this._position;
	};

	PointCloudGroup.prototype.getQuaternion = function() {
		return this._quaternion;
	};

	PointCloudGroup.prototype.getSize = function() {
		return this._size;
	};

	PointCloudGroup.prototype.getColor = function() {
		return this._color;
	};

	function getVertices(matrix) {
		const l = 0.5;
		const vertices = [
			new THREE.Vector3(-l, -l, -l), new THREE.Vector3(l, -l, -l), new THREE.Vector3(-l, l, -l), new THREE.Vector3(l, l, -l),
			new THREE.Vector3(-l, -l, l), new THREE.Vector3(l, -l, l), new THREE.Vector3(-l, l, l), new THREE.Vector3(l, l, l)
		];
		vertices.forEach(v => v.applyMatrix4(matrix));
		return vertices;
	}

	function checkIntersection(group1, group2) {
		const matrix = group1.getMatrix().invert().multiply(group2.getMatrix());
		const vertices = getVertices(matrix);
		return !(
			vertices.every(v => v.x < -0.5) || vertices.every(v => v.x > 0.5) ||
			vertices.every(v => v.y < -0.5) || vertices.every(v => v.y > 0.5) ||
			vertices.every(v => v.z < -0.5) || vertices.every(v => v.z > 0.5)
		);
	}

	PointCloudGroup.prototype.intersectsGroup = function(group) {
		return checkIntersection(this, group) && checkIntersection(group, this);
	};

	PointCloudGroup.prototype.overlapsGroup = function(group) {
		const matrix = this.getMatrix().invert().multiply(group.getMatrix());
		const vertices = getVertices(matrix);
		return vertices.every(v => v.x >= -0.5) && vertices.every(v => v.x <= 0.5) &&
			vertices.every(v => v.y >= -0.5) && vertices.every(v => v.y <= 0.5) &&
			vertices.every(v => v.z >= -0.5) && vertices.every(v => v.z <= 0.5);
	};

	PointCloudGroup.prototype.containsPoint = function(px, py, pz) {
		this._matrixInv ??= this.getMatrix().invert();
		const p = new THREE.Vector3(px, py, pz).applyMatrix4(this._matrixInv);
		return p.x >= -0.5 && p.x <= 0.5 && p.y >= -0.5 && p.y <= 0.5 && p.z >= -0.5 && p.z <= 0.5;
	};

	return PointCloudGroup;
});
