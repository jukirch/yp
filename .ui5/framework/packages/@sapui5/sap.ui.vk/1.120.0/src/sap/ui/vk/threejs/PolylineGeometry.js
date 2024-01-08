/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the PolylineGeometry class.
sap.ui.define([
	"../thirdparty/three"
], function(
	THREE
) {
	"use strict";

	function PolylineGeometry() {
		var _this = new THREE.InstancedBufferGeometry();

		Object.setPrototypeOf(_this, PolylineGeometry.prototype);

		_this.type = "PolylineGeometry";

		var positions = [-1, 2, 0, 1, 2, 0, -1, 1, 0, 1, 1, 0, -1, 0, 0, 1, 0, 0, -1, -1, 0, 1, -1, 0];
		var uvs = [2, -1, 2, 1, 1, -1, 1, 1, -1, -1, -1, 1, -2, -1, -2, 1];
		var index = [0, 2, 1, 2, 3, 1, 2, 4, 3, 4, 5, 3, 4, 6, 5, 6, 7, 5];

		_this.setIndex(index);
		_this.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
		_this.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

		return _this;
	}

	PolylineGeometry.prototype = Object.assign(Object.create(THREE.InstancedBufferGeometry.prototype), {
		constructor: PolylineGeometry,

		isPolylineGeometry: true,

		setVertices: function(vertices, indices) {
			this.vertices = vertices;
			this.indices = indices;

			const numSegments = indices ? (indices.length >> 1) : vertices.length - 1;
			const lineSegments = new Float32Array(6 * numSegments);

			for (let i = 0, c = 0; i < numSegments; i++) {
				let a, b;
				if (indices) {
					a = vertices[indices[i << 1]];
					b = vertices[indices[(i << 1) + 1]];
				} else {
					a = vertices[i];
					b = vertices[i + 1];
				}

				lineSegments[c++] = a.x;
				lineSegments[c++] = a.y;
				lineSegments[c++] = a.z;
				lineSegments[c++] = b.x;
				lineSegments[c++] = b.y;
				lineSegments[c++] = b.z;
			}

			var instanceBuffer = new THREE.InstancedInterleavedBuffer(lineSegments, 6, 1); // xyz, xyz

			this.setAttribute("instanceStart", new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 0)); // xyz
			this.setAttribute("instanceEnd", new THREE.InterleavedBufferAttribute(instanceBuffer, 3, 3)); // xyz

			const instanceDistanceBuffer = new THREE.InstancedInterleavedBuffer(new Float32Array(2 * numSegments), 2, 1);
			this.setAttribute("instanceDistance", new THREE.InterleavedBufferAttribute(instanceDistanceBuffer, 2, 0));

			this.computeBoundingBox();
			this.computeBoundingSphere();

			return this;
		},

		computeBoundingBox: function() {
			if (this.boundingBox === null) {
				this.boundingBox = new THREE.Box3();
			}
			this.boundingBox.setFromPoints(this.vertices);
		},

		computeBoundingSphere: function() {
			if (this.boundingSphere === null) {
				this.boundingSphere = new THREE.Sphere();
			}
			this.boundingSphere.setFromPoints(this.vertices);
		},

		_updateVertices: function(indices) {
			var vertices = this.vertices;
			var data = this.attributes.instanceStart.data;
			var array = data.array;

			indices.forEach(function(vi) {
				var v = vertices[vi];
				var i = vi * 6 - 3;
				if (i >= 0) { // instance start
					array[i + 0] = v.x;
					array[i + 1] = v.y;
					array[i + 2] = v.z;
				}
				if (i + 5 < array.length) { // instance end
					array[i + 3] = v.x;
					array[i + 4] = v.y;
					array[i + 5] = v.z;
				}
			});

			data.needsUpdate = true;

			this.computeBoundingBox();
			this.computeBoundingSphere();
		},

		copy(source) {
			THREE.InstancedBufferGeometry.prototype.copy.call(this, source);
			this.vertices = source.vertices;
			this.indices = source.indices;
			return this;
		}
	});

	return PolylineGeometry;
});
