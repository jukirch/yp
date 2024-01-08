/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.PointCloudSelectionToolGizmo
sap.ui.define([
	"sap/ui/events/KeyCodes",
	"../thirdparty/three",
	"../thirdparty/BufferGeometryUtils",
	"../threejs/PolylineMesh",
	"../threejs/PolylineGeometry",
	"../threejs/PolylineMaterial",
	"../threejs/PointCloudGroup",
	"./Gizmo",
	"./AxisColours",
	"sap/base/assert"
], function(
	KeyCodes,
	THREE,
	BufferGeometryUtils,
	PolylineMesh,
	PolylineGeometry,
	PolylineMaterial,
	PointCloudGroup,
	Gizmo,
	AxisColours,
	assert
) {
	"use strict";

	/**
	 * Constructor for a PointCloudSelectionToolGizmo.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Provides gizmos for PointCloudSelectionTool
	 * @extends sap.ui.vk.tools.Gizmo
	 *
	 * @author SAP SE
	 * @version 1.120.0
	 *
	 * @constructor
	 * @private
	 * @alias sap.ui.vk.tools.PointCloudSelectionToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	const PointCloudSelectionToolGizmo = Gizmo.extend("sap.ui.vk.tools.PointCloudSelectionToolGizmo", /** @lends sap.ui.vk.tools.PointCloudSelectionToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk"
		},
		renderer: {
			apiVersion: 2,
			render: function(rm, control) {
				rm.openStart("div", control);
				rm.class("sapUiVkTransformationToolEdit");
				rm.openEnd();
				rm.close("div");
			}
		}
	});

	const gizmoSize = 96;
	const axisNames = ["x", "y", "z"];

	PointCloudSelectionToolGizmo.prototype.init = function() {
		Gizmo.prototype.init?.apply(this);

		this._currentGroupIndex = -1;

		this._viewport = null;
		this._tool = null;
		this._sceneGizmo = new THREE.Scene();
		const light = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		light.position.set(1, 3, 2);
		this._sceneGizmo.add(light);
		this._sceneGizmo.add(new THREE.AmbientLight(0xFFFFFF, 0.5));
		const touchAreas = this._touchAreas = new THREE.Group();
		// this._sceneGizmo.add(touchAreas);
		const gizmo = this._gizmo = new THREE.Group();
		this._sceneGizmo.add(gizmo);
		this._matViewProj = new THREE.Matrix4();
		this._groups = [];
		const touchObjMaterial = new THREE.MeshBasicMaterial({
			opacity: 0.2,
			transparent: true,
			side: THREE.DoubleSide
		});

		function addTouchGeometry(geometry) {
			touchAreas.add(new THREE.Mesh(geometry, touchObjMaterial));
		}

		function addGizmoAxis(dir, color) {
			const axisLength = 96,
				lineRadius = 1,
				coneHeight = 0,
				// coneHeight = 24,
				// coneRadius = 4,
				touchRadius = 48;
			dir.multiplyScalar(1 / axisLength);
			const lineGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, axisLength - coneHeight, 4);
			const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(dir.y, dir.z, dir.x), dir, new THREE.Vector3(dir.z, dir.x, dir.y));
			m.setPosition(dir.clone().multiplyScalar((axisLength - coneHeight) * 0.5));
			lineGeometry.applyMatrix4(m);
			const material = new THREE.MeshLambertMaterial({
				color: color,
				transparent: true
			});
			const line = new THREE.Mesh(lineGeometry, material);
			line.matrixAutoUpdate = false;
			gizmo.add(line);

			const touchGeometry = new THREE.CylinderGeometry(touchRadius * 0.45, touchRadius * 0.45, touchRadius, 12, 1);
			touchGeometry.applyMatrix4(m);
			const touchGeometry2 = new THREE.CylinderGeometry(touchRadius * 0.45, touchRadius * 0.2, touchRadius, 12, 1);
			m.setPosition(dir.clone().multiplyScalar(axisLength * 0.5));
			touchGeometry2.applyMatrix4(m);
			const mergedGeometry = BufferGeometryUtils.mergeGeometries([touchGeometry, touchGeometry2]);
			addTouchGeometry(mergedGeometry);
		}

		function addGizmoPlane(a, b) {
			const colors = new Float32Array(9);
			colors[a] = colors[b + 6] = 1;
			colors[a + 3] = colors[b + 3] = 0.5;
			const geometry = new THREE.BufferGeometry();
			const vertices = new Float32Array(12);
			vertices[3 + a] = vertices[6 + b] = vertices[9 + a] = vertices[9 + b] = 0.333;
			geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
			geometry.setIndex([0, 2, 1, 1, 2, 3]);
			const material = new THREE.MeshBasicMaterial({
				color: 0xFFFF00,
				opacity: 0.5,
				transparent: true,
				visible: false,
				side: THREE.DoubleSide
			});
			const plane = new THREE.Mesh(geometry, material);
			plane.matrixAutoUpdate = false;
			plane.userData.colors = colors;

			const lineGeometry = new THREE.BufferGeometry();
			const lineVertices = new Float32Array(9);
			lineVertices[a] = lineVertices[a + 3] = lineVertices[b + 3] = lineVertices[b + 6] = 0.333;
			lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lineVertices, 3));
			lineGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
			const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
				vertexColors: true,
				transparent: true,
				linewidth: window.devicePixelRatio
			}));
			line.matrixAutoUpdate = false;
			plane.add(line);

			gizmo.add(plane);
			addTouchGeometry(geometry);
		}

		function createTorusGeometry(radius, segments, axis) {
			const geometry = new THREE.TorusGeometry(1, radius, 4, segments, Math.PI / 2);
			if (axis === 0) {
				geometry.rotateY(Math.PI / -2);
			} else if (axis === 1) {
				geometry.rotateX(Math.PI / 2);
			}
			return geometry;
		}

		function addGizmoArc(axis, color, segments) {
			const geometry = createTorusGeometry(1 / 96, segments, axis);
			const arc = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
				color: color,
				transparent: true
			}));
			arc.matrixAutoUpdate = false;
			gizmo.add(arc);
		}

		// create 3 axes
		addGizmoAxis(new THREE.Vector3(1, 0, 0), AxisColours.x);
		addGizmoAxis(new THREE.Vector3(0, 1, 0), AxisColours.y);
		addGizmoAxis(new THREE.Vector3(0, 0, 1), AxisColours.z);

		// create 3 planes
		addGizmoPlane(1, 2);
		addGizmoPlane(2, 0);
		addGizmoPlane(0, 1);

		// create 3 arcs
		for (let i = 0; i < 3; i++) {
			addGizmoArc(i, AxisColours[axisNames[i]], 32);
			addTouchGeometry(createTorusGeometry(16 / 96, 4, i));
		}

		for (let i = 0; i < 6; i++) {
			const axis = i >> 1;
			const boxHandleGeometry = new THREE.ConeGeometry(0.125, 0.25, 16);
			boxHandleGeometry.translate(0, 0.125, 0);
			if (axis === 0) {
				boxHandleGeometry.rotateZ(Math.PI / (i & 1 ? -2 : 2));
			} else if (axis === 2) {
				boxHandleGeometry.rotateX(Math.PI / (i & 1 ? 2 : -2));
			} else if (i === 2) {
				boxHandleGeometry.rotateX(Math.PI);
			}
			const boxHandleObject = new THREE.Mesh(boxHandleGeometry, new THREE.MeshLambertMaterial({
				color: AxisColours[axisNames[axis]],
				transparent: true
			}));
			gizmo.add(boxHandleObject);
			const tg = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 12, 1);
			if (axis === 0) {
				tg.rotateZ(Math.PI / 2);
			} else if (axis === 2) {
				tg.rotateX(Math.PI / -2);
			}
			addTouchGeometry(tg);
		}

		gizmo.children.forEach(function(mesh) {
			mesh.userData.color = mesh.material.color.toJSON();
		});

		const polylineMaterialSettings = {
			color: 0xFFFFFF,
			linewidth: 2,
			dashCapStyle: 0,
			dashPattern: [5, 5],
			segmentCapStyle: 1,
			trimStyle: 0,
			transparent: true
		};
		this._polylineMaterial1 = new PolylineMaterial(Object.assign({ lineColor: 0xCCCC00, dashOffset: 5 }, polylineMaterialSettings));
		this._polylineMaterial2 = new PolylineMaterial(Object.assign({ lineColor: 0xFFFF00, dashOffset: 0 }, polylineMaterialSettings));
		const l = 0.5;
		const boxGeometry = new PolylineGeometry();
		boxGeometry.setVertices([
			new THREE.Vector3(-l, -l, -l), new THREE.Vector3(l, -l, -l), new THREE.Vector3(-l, l, -l), new THREE.Vector3(l, l, -l),
			new THREE.Vector3(-l, -l, l), new THREE.Vector3(l, -l, l), new THREE.Vector3(-l, l, l), new THREE.Vector3(l, l, l)
		], [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]);
		this._boxMesh = new THREE.Scene();
		this._boxMesh.add(new PolylineMesh(boxGeometry, this._polylineMaterial1));
		this._boxMesh.add(new PolylineMesh(boxGeometry.clone(), this._polylineMaterial2));
	};

	PointCloudSelectionToolGizmo.prototype.hasDomElement = function() {
		return true;
	};

	PointCloudSelectionToolGizmo.prototype.show = function(viewport, tool) {
		this._viewport = viewport;
		this._tool = tool;

		this._updatePointCloudGroups();
		this._updateSceneMaterials();

		// this._onKeyDownListener = this._onKeyDown.bind(this);
		// document.addEventListener("keydown", this._onKeyDownListener);
	};

	PointCloudSelectionToolGizmo.prototype.hide = function() {
		// document.removeEventListener("keydown", this._onKeyDownListener);

		this._updatePointCloudGroups([]);
		this._updateSceneMaterials();

		this._viewport = null;
		this._tool = null;
	};

	PointCloudSelectionToolGizmo.prototype._updateSceneMaterials = function() {
		const scene = this._viewport?.getScene()?.getSceneRef();
		scene?.traverse(function(object) {
			if (object.geometry?.userData.isPointCloud && object.material) {
				object.material.needsUpdate = true;
				if (object.userData.originalMaterial) {
					object.userData.originalMaterial.needsUpdate = true;
				}
			}
		});
	};

	const viewportSize = new THREE.Vector2();
	const matViewProj = new THREE.Matrix4();
	const matWorldViewProj = new THREE.Matrix4();

	PointCloudSelectionToolGizmo.prototype.addGroup = function(settings) {
		this._currentGroupIndex = this._groups.length;
		settings ??= {};
		settings.color = this._tool?.getSelectionColor()?.slice() || [0, 1, 0, 1];
		let dist = 100;
		if (this._viewport) {
			const camera = this._viewport.getCamera().getCameraRef();
			if (settings.position instanceof THREE.Vector3) {
				dist = (camera.isPerspectiveCamera ? -settings.position.clone().applyMatrix4(camera.matrixWorldInverse).z : 1) / camera.projectionMatrix.elements[5];
			} else {
				this._viewport.getRenderer().getSize(viewportSize);
				const hit = this._viewport.hitTest(viewportSize.x >> 1, viewportSize.y >> 1);
				if (hit) {
					dist = hit.distance;
					settings.position ??= hit.point;
				} else {
					dist = (camera.near + camera.far) * 0.5;
					settings.position ??= new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2).multiplyScalar(-dist).add(camera.position);
				}
				dist = (camera.isPerspectiveCamera ? dist : 1) / camera.projectionMatrix.elements[5];
			}
		}
		settings.size ??= dist * 0.5;

		const group = new PointCloudGroup(settings);
		this._groups.push(group);
		this._updatePointCloudGroups();
		this._updateSceneMaterials();

		this._tool?.fireGroupAdded({ group });
		this._tool?.fireCurrentGroupChanged({ group });
		return group;
	};

	PointCloudSelectionToolGizmo.prototype.removeGroup = function(group) {
		if (group == null) {
			group = this._groups.pop();
		} else {
			const index = typeof group === "number" ? group : this._groups.indexOf(group);
			if (index >= 0) {
				group = this._groups.splice(index, 1)[0];
			} else {
				group = null;
			}
		}
		if (group) {
			this._currentGroupIndex = Math.min(this._currentGroupIndex, this._groups.length - 1);
			this._updatePointCloudGroups();
			this._updateSceneMaterials();
			this._tool?.fireGroupRemoved({ group });
			this._tool?.fireCurrentGroupChanged({ group: this.getCurrentGroup() });
		}
		return group;
	};

	PointCloudSelectionToolGizmo.prototype.clearGroups = function(group) {
		this._groups.length = 0;
		this._currentGroupIndex = -1;
		this._updatePointCloudGroups();
		this._updateSceneMaterials();
	};

	PointCloudSelectionToolGizmo.prototype.getGizmoCount = function() {
		return this.getCurrentGroup() != null ? 1 : 0;
	};

	PointCloudSelectionToolGizmo.prototype._updateGizmoObjectTransformation = function(obj, groupIndex) {
		const group = this._groups[groupIndex];
		obj.position.copy(group._position);
		obj.quaternion.copy(group._quaternion);
		const scale = this._getGizmoScale(obj.position);
		obj.scale.setScalar(gizmoSize * scale);
		obj.updateMatrixWorld(true);

		// update box handles position
		for (let i = 0; i < 3; i++) {
			const l = group._size.getComponent(i) * 0.5 / obj.scale.x;
			obj.children[9 + i * 2].position.setComponent(i, -l);
			obj.children[9 + i * 2].updateMatrixWorld(true);
			obj.children[10 + i * 2].position.setComponent(i, l);
			obj.children[10 + i * 2].updateMatrixWorld(true);
		}

		return scale;
	};

	PointCloudSelectionToolGizmo.prototype._updateGizmoTransformation = function(i) {
		const scale = this._updateGizmoObjectTransformation(this._gizmo, i);
		this._gizmo.scale.setScalar(gizmoSize * scale);
		this._gizmo.updateMatrixWorld(true);
	};

	PointCloudSelectionToolGizmo.prototype.getTouchObject = function(i) {
		this._updateGizmoObjectTransformation(this._touchAreas, this._currentGroupIndex);
		return this._touchAreas;
	};

	PointCloudSelectionToolGizmo.prototype.highlightHandle = function(handleIndex, hoverMode) {
		if (this._handleIndex === handleIndex && this._hoverMode === hoverMode) {
			return;
		}

		this._handleIndex = handleIndex;
		this._hoverMode = hoverMode;

		const highlightColor = 0xFFFF00;
		const inactiveHandleOpacity = 0.35;

		const axisHighlighting = [1, 2, 4, 6, 5, 3, 1, 2, 4];
		for (let i = 0; i < 3; i++) { // axes
			const axis = this._gizmo.children[i];
			axis.visible = handleIndex < 9 || hoverMode;
			axis.material.color.setHex(axisHighlighting[handleIndex] & (1 << i) ? highlightColor : axis.userData.color);
			axis.material.opacity = handleIndex < 9 ? 1 : inactiveHandleOpacity;
		}

		for (let i = 3; i < 6; i++) { // planes
			const plane = this._gizmo.children[i];
			plane.material.visible = i === handleIndex;

			const colorAttr = plane.children[0].geometry.attributes.color;
			colorAttr.copyArray(i === handleIndex ? [1, 1, 0, 1, 1, 0, 1, 1, 0] : plane.userData.colors);
			colorAttr.needsUpdate = true;
			plane.children[0].visible = i === handleIndex || hoverMode;
			plane.children[0].material.opacity = i === handleIndex || (hoverMode && handleIndex === -1) ? 1 : inactiveHandleOpacity;
		}

		for (let i = 6; i < 9; i++) { // arcs
			const arc = this._gizmo.children[i];
			arc.visible = (i === handleIndex || hoverMode);
			arc.material.color.setHex(i === handleIndex ? highlightColor : arc.userData.color); // arc color
			arc.material.opacity = (i === handleIndex || (hoverMode && handleIndex === -1)) ? 1 : inactiveHandleOpacity;
		}

		for (let i = 9; i < 15; i++) { // box handles
			const boxHandle = this._gizmo.children[i];
			boxHandle.visible = (i === handleIndex || hoverMode);
			boxHandle.material.color.setHex(i === handleIndex ? highlightColor : boxHandle.userData.color);
			boxHandle.material.opacity = (i === handleIndex || (hoverMode && handleIndex === -1)) ? 1 : inactiveHandleOpacity;
		}

		this._viewport?.setShouldRenderFrame();
	};

	PointCloudSelectionToolGizmo.prototype.beginGesture = function() {
		const group = this.getCurrentGroup();
		if (group) {
			this._originPosition = group._position.clone();
			this._originSize = group._size.clone();
			this._originQuaternion = group._quaternion.clone();
		}
	};

	PointCloudSelectionToolGizmo.prototype.endGesture = function() {
	};

	PointCloudSelectionToolGizmo.prototype._setGroupPosition = function(position, horizontal) {
		const group = this.getCurrentGroup();
		if (group) {
			if (horizontal) {
				group._position.x = position.x;
				group._position.z = position.z;
			} else {
				group._position.copy(position);
			}
			this._updatePointCloudGroups();
		}
	};

	PointCloudSelectionToolGizmo.prototype._setOffset = function(offset) {
		const group = this.getCurrentGroup();
		if (group) {
			group?._position.copy(this._originPosition).add(offset);
			this._updatePointCloudGroups();
		}
	};

	PointCloudSelectionToolGizmo.prototype._setSize = function(side, delta, axis, uniform, horizontal) {
		const group = this.getCurrentGroup();
		if (group) {
			const i = side >> 1;
			let size = this._originSize.getComponent(i) + delta;
			this.highlightHandle(9 + (size >= 0 ? side : (side & ~1) + 1 - (side & 1)), false);
			size = Math.abs(size);

			group._size.copy(this._originSize);
			if (horizontal) {
				const scale = size / this._originSize.getComponent(i);
				if (i !== 1) {
					group._size.x *= scale;
					group._size.z *= scale;
				} else {
					group._size.y *= scale;
				}
			} else if (uniform) {
				group._size.multiplyScalar(size / this._originSize.getComponent(i));
			} else {
				group._size.setComponent(i, size);
				group._position.copy(axis).multiplyScalar(delta * 0.5).add(this._originPosition);
			}
			this._updatePointCloudGroups();
		}
	};

	PointCloudSelectionToolGizmo.prototype._setRotationAxisAngle = function(axisIndex, deltaAngle) {
		const group = this.getCurrentGroup();
		if (group) {
			const euler = new THREE.Euler();
			euler[axisNames[axisIndex]] = deltaAngle;
			group._quaternion.setFromEuler(euler).premultiply(this._originQuaternion);

			this._updatePointCloudGroups();
		}
	};

	PointCloudSelectionToolGizmo.prototype._updatePointCloudGroups = function(groups) {
		const sceneUserData = this._viewport?.getScene()?.getSceneRef()?.userData;
		if (sceneUserData) {
			groups ??= this._groups;
			sceneUserData.pointCloudGroupMatrices = groups.map(function(group) { return group.getMatrix().invert().transpose(); });
			sceneUserData.pointCloudGroupColors = groups.map(function(group) { return group.getColor(); });
			this._viewport?.setShouldRenderFrame();
		}
	};

	PointCloudSelectionToolGizmo.prototype.expandBoundingBox = function(boundingBox) {
		if (this._viewport) {
			this._expandBoundingBox(boundingBox, this._viewport.getCamera().getCameraRef(), true);
		}
	};

	PointCloudSelectionToolGizmo.prototype.getCurrentGroup = function() {
		return this._currentGroupIndex >= 0 && this._currentGroupIndex < this._groups.length ? this._groups[this._currentGroupIndex] : null;
	};

	PointCloudSelectionToolGizmo.prototype._previousGroup = function() {
		if (this._currentGroupIndex > 0) {
			this._currentGroupIndex--;
		}
		this._viewport?.setShouldRenderFrame();
		this._tool?.fireCurrentGroupChanged({ group: this.getCurrentGroup() });
	};

	PointCloudSelectionToolGizmo.prototype._nextGroup = function() {
		if (this._currentGroupIndex < this._groups.length) {
			this._currentGroupIndex++;
		}
		this._viewport?.setShouldRenderFrame();
		this._tool?.fireCurrentGroupChanged({ group: this.getCurrentGroup() });
	};

	PointCloudSelectionToolGizmo.prototype._isCurrentGroupAdditive = function() {
		const group = this.getCurrentGroup();
		if (group) {
			return group._color.w > 0 ? true : false;
		}
		return undefined;
	};

	PointCloudSelectionToolGizmo.prototype._changeCurrentGroupType = function(additive) {
		const group = this.getCurrentGroup();
		if (group) {
			group._color.w = additive ? (this._tool?.getSelectionColor()[3] || 1) : 0;
			this._updatePointCloudGroups();
			this._tool?.fireCurrentGroupChanged({ group });
		}
	};

	// PointCloudSelectionToolGizmo.prototype._onKeyDown = function(event) {
	// 	if (this._groups.length > 0) {
	// 		switch (event.keyCode) {
	// 			case KeyCodes.COMMA: this._previousGroup(); break;
	// 			case KeyCodes.DOT: this._nextGroup(); break;
	// 			case KeyCodes.PIPE: this._changeCurrentGroupType(!this._isCurrentGroupAdditive()); break;
	// 			default: return;
	// 		}
	// 	}
	// };

	PointCloudSelectionToolGizmo.prototype.render = function() {
		assert(this._viewport && this._viewport.getMetadata().getName() === "sap.ui.vk.threejs.Viewport", "Can't render gizmo without sap.ui.vk.threejs.Viewport");

		const renderer = this._viewport.getRenderer();
		const camera = this._viewport.getCamera().getCameraRef();

		renderer.clearDepth();

		renderer.getSize(viewportSize);
		this._polylineMaterial1.resolution.copy(viewportSize);
		this._polylineMaterial2.resolution.copy(viewportSize);
		matViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		const nearZ = camera instanceof THREE.PerspectiveCamera ? camera.near : undefined;

		this._groups.forEach((group, index) => {// render boxes
			this._boxMesh.position.copy(group._position);
			this._boxMesh.quaternion.copy(group._quaternion);
			this._boxMesh.scale.copy(group._size);
			this._boxMesh.updateMatrixWorld(true);

			matWorldViewProj.multiplyMatrices(matViewProj, this._boxMesh.matrixWorld);
			this._boxMesh.children.forEach(function(child) {
				child.computeLineDistances(matWorldViewProj, viewportSize, nearZ);
			});

			this._polylineMaterial1.opacity = this._polylineMaterial2.opacity = index === this._currentGroupIndex ? 1 : 0.15;

			renderer.render(this._boxMesh, camera);
		});

		if (this.getCurrentGroup()) { // render gizmo
			this._updateGizmoTransformation(this._currentGroupIndex);
			renderer.render(this._sceneGizmo, camera);
		}
	};

	return PointCloudSelectionToolGizmo;
});
