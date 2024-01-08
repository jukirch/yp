/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"./IndexCompressor"
], function(IndexCompressor) {
	"use strict";

	const IS_POLYLINE = 1;
	const HAS_NORMALS = 2;
	const HAS_TEXTURE_COORDINATES = 4;
	// const HAS_TANGENTS_BINORMALS = 8; -- should never appear in the file, as they are built on load
	const HAS_FACEIDS = 16;
	const HAS_COLORS = 32;

	var VDSBOUNDINGBOX_MIN_X = 0;
	// var VDSBOUNDINGBOX_MIN_Y = 1;
	// var VDSBOUNDINGBOX_MIN_Z = 2;
	var VDSBOUNDINGBOX_MAX_X = 3;
	// var VDSBOUNDINGBOX_MAX_Y = 4;
	// var VDSBOUNDINGBOX_MAX_Z = 5;

	var GeometryFactory = function() { };

	GeometryFactory.getGeometryInfo = function(geometryHeader, geometryBufferUint8, tempBuffer) {
		var dv = new DataView(geometryBufferUint8.buffer, geometryBufferUint8.byteOffset, geometryBufferUint8.byteLength);
		var offset = 0; // offset for ScopeId and id etc.

		const bHasNormals = (geometryHeader.flags & HAS_NORMALS) > 0;
		const bHasColors = (geometryHeader.flags & HAS_COLORS) > 0;
		const bHasTexCoords = (geometryHeader.flags & HAS_TEXTURE_COORDINATES) > 0;
		const bHasFaceIds = (geometryHeader.flags & HAS_FACEIDS) > 0;
		let pointCount = geometryHeader.pointCount;
		const elementCount = geometryHeader.elementCount;
		const isPointCloud = elementCount === 0;
		const isPolyline = isPointCloud ? false : (geometryHeader.flags & IS_POLYLINE) > 0;
		const itemCount = isPolyline ? 2 : 3;
		const indexCount = elementCount * itemCount;

		if (!pointCount) {
			throw "No points in geometry";
		}

		var points = tempBuffer ? tempBuffer.points.subarray(0, pointCount * 3) : new Float32Array(pointCount * 3);

		var normals = null;
		if (bHasNormals) {
			normals = tempBuffer ? tempBuffer.normals.subarray(0, pointCount * 3) : new Float32Array(pointCount * 3);
		}

		var colors = null;
		if (bHasColors) {
			colors = tempBuffer ? tempBuffer.colors.subarray(0, pointCount * 3) : new Float32Array(pointCount * 3);
		}

		var uvs = null;
		if (bHasTexCoords) {
			uvs = tempBuffer ? tempBuffer.uvs.subarray(0, pointCount * 2) : new Float32Array(pointCount * 2);
		}

		var indices;
		if (isPointCloud) {
			indices = null;
		} else if (tempBuffer) {
			if (tempBuffer.indices.length < indexCount) {
				tempBuffer.indices = new Uint16Array(indexCount);
			}
			if (tempBuffer.previousIndexCount < indexCount) {
				tempBuffer.previousIndexCount = indexCount;
			}
			indices = tempBuffer.indices.subarray(0, indexCount);
		} else {
			indices = new Uint16Array(indexCount);
		}

		if (geometryHeader.encodingType === 0) {
			for (var vi = 0; vi < pointCount; ++vi) {
				points[vi * 3] = dv.getFloat32(offset, true);
				points[vi * 3 + 1] = dv.getFloat32(offset + 4, true);
				points[vi * 3 + 2] = dv.getFloat32(offset + 8, true);
				offset += 12;

				if (bHasNormals) {
					normals[vi * 3] = dv.getFloat32(offset, true);
					normals[vi * 3 + 1] = dv.getFloat32(offset + 4, true);
					normals[vi * 3 + 2] = dv.getFloat32(offset + 8, true);
					offset += 12;
				}

				if (bHasTexCoords) {
					uvs[vi * 2] = dv.getFloat32(offset, true);
					uvs[vi * 2 + 1] = dv.getFloat32(offset + 4, true);
					offset += 8;
				}
			}

			for (var ii = 0; ii < indexCount; ++ii) {
				indices[ii] = dv.getUint16(offset, true);
				offset += 2;
			}
		} else {
			var indexCompressor = new IndexCompressor(geometryBufferUint8, geometryBufferUint8.length);
			indexCompressor.setCurByte(offset); // offset for ScopeId and id

			if (!indexCompressor.ReadCommand()) {
				throw "Buffer overflow 1";
			}

			var uQuantsPos = indexCompressor.rvalue;
			if (uQuantsPos) {
				if (!UnquantizePositions(indexCompressor, pointCount, uQuantsPos, geometryHeader.box, points)) {
					throw "Unquantize positions failed";
				}
			}

			var uQuantsNrm = 1; // '1' so that it doesn't go into some of the 'if's below
			if (bHasNormals) {
				// read number of normal quants
				if (!indexCompressor.ReadCommand()) {
					throw "Buffer overflow 2";
				}

				// decode quantized normals
				uQuantsNrm = indexCompressor.rvalue;
				if (uQuantsNrm) {
					if (!UnquantizeNormals(indexCompressor, pointCount, uQuantsNrm, normals)) {
						throw "Unquantize normals failed";
					}
				}
			}

			var uQuantsTex = 1; // '1' so that it doesn't go into some of the 'if's below
			var bNeedTexcoordMinMax = false;
			if (bHasTexCoords) {
				// read number of texcoord quants
				if (!indexCompressor.ReadCommand()) {
					throw "Buffer overflow 3";
				}

				// decode quantized texture coordinates
				uQuantsTex = indexCompressor.rvalue;
				if (uQuantsTex) {
					if (!UnquantizeTexCoord(indexCompressor, pointCount, uQuantsTex, uvs)) {
						throw "Unquantize uvs failed";
					}

					bNeedTexcoordMinMax = true;
				}
			}

			if (!uQuantsPos || !uQuantsNrm || !uQuantsTex || bNeedTexcoordMinMax) { // we have some uncompressed data to read

				if (bNeedTexcoordMinMax) { // uncompressed texture coordinates min/max
					offset = indexCompressor.getCurByte(); // pass offset of quant flag
					var tmin = dv.getFloat32(offset, true);
					var tmax = dv.getFloat32(offset + 4, true);

					indexCompressor.moveCurByte(8);

					if ((tmin !== 0.0) || (tmax !== 1.0)) { // rescale all texture coordinate values, as they were read as [0..1] range
						var scale = tmax - tmin;
						for (var ti = 0, tc2 = pointCount * 2; ti < tc2; ti++) {
							uvs[ti] = uvs[ti] * scale + tmin;
						}
					}
				}

				var pi;
				if (!uQuantsPos) { // uncompressed positions
					offset = indexCompressor.getCurByte(); // pass offset of quant flag
					for (pi = 0; pi < pointCount; pi++) {
						points[pi * 3] = dv.getFloat32(offset + pi * 4, true);
						points[pi * 3 + 1] = dv.getFloat32(offset + (pi + pointCount) * 4, true);
						points[pi * 3 + 2] = dv.getFloat32(offset + (pi + pointCount * 2) * 4, true);
					}
					indexCompressor.moveCurByte(pointCount * 3 * 4);
				}

				if (!uQuantsNrm && bHasNormals) { // uncompressed normals
					offset = indexCompressor.getCurByte(); // pass offset of quant flag
					for (pi = 0; pi < pointCount; pi++) {
						normals[pi * 3] = dv.getFloat32(offset + pi * 4, true);
						normals[pi * 3 + 1] = dv.getFloat32(offset + (pi + pointCount) * 4, true);
						normals[pi * 3 + 2] = dv.getFloat32(offset + (pi + pointCount * 2) * 4, true);
					}
					indexCompressor.moveCurByte(pointCount * 3 * 4);
				}

				if (!uQuantsTex && bHasTexCoords) { // uncompressed texture coordinates
					offset = indexCompressor.getCurByte(); // pass offset of quant flag
					for (pi = 0; pi < pointCount; pi++) {
						uvs[pi * 2] = dv.getFloat32(offset + pi * 4, true);
						uvs[pi * 2 + 1] = dv.getFloat32(offset + (pi + pointCount) * 4, true);
					}
					indexCompressor.moveCurByte(pointCount * 2 * 4);
				}
			}

			let i, j;
			if (elementCount > 0) {
				const cByte = indexCompressor.getCurByte(); // back it up before reset
				indexCompressor.Reset();
				indexCompressor.setCurByte(cByte);

				let prevVertical = [0, 0, 0];
				for (i = 0; i < elementCount; i++) {
					for (j = 0; j < itemCount; j++) {
						if (!indexCompressor.ReadCommand(prevVertical[j])) {
							throw "UIC1 Decompression error - elements";
						}

						indices[i * itemCount + j] = indexCompressor.rvalue;
						prevVertical[j] = indexCompressor.rvalue;
					}
				}
			}

			if (bHasColors) {
				if (bHasFaceIds) {
					const cByte = indexCompressor.getCurByte();
					indexCompressor.Reset();
					indexCompressor.setCurByte(cByte);
					for (i = 0; i < elementCount; i++) {
						// skip face ids, we don't need them for now
						if (!indexCompressor.ReadCommand()) {
							throw "UIC1 Decompression error - face ids";
						}
					}
				}

				const cByte = indexCompressor.getCurByte();
				indexCompressor.Reset();
				indexCompressor.setCurByte(cByte);
				if (!indexCompressor.ReadCommand()) {
					throw "UIC1 Decompression error - colors1";
				}

				if (indexCompressor.rvalue === 0) {
					throw "UIC1 Decompression error - colors2";
				}

				const quant = 1.0 / indexCompressor.rvalue;
				for (j = 0; j < 3; ++j) {
					for (i = 0; i < pointCount; ++i) {
						if (!indexCompressor.ReadCommand()) {
							throw "UIC1 Decompression error - colors3";
						}

						colors[i * 3 + j] = quant * indexCompressor.rvalue;
					}
				}
			}
		}

		return {
			id: geometryHeader.id,
			isPointCloud: isPointCloud,
			isPolyline: isPolyline,
			data: {
				indices: indices,
				points: points,
				colors: colors,
				normals: normals,
				uvs: uvs
			}
		};
	};

	function UnquantizePositions(indexCompressor, pointCount, nQuants, boundingBox, points) {
		for (var xyz = 0; xyz < 3; xyz++) { // XXX, YYY, ZZZ
			var vmin = boundingBox[VDSBOUNDINGBOX_MIN_X + xyz];
			var quant = (boundingBox[VDSBOUNDINGBOX_MAX_X + xyz] - vmin) / nQuants;
			for (var i = 0; i < pointCount; i++) {
				if (!indexCompressor.ReadCommand()) {
					return false;
				}
				points[i * 3 + xyz] = quant * indexCompressor.rvalue + vmin;
			}
		}

		return true;
	}

	function UnquantizeNormals(indexCompressor, pointCount, nQuants, normals) {
		var pi;
		for (pi = 0; pi < pointCount; pi++) {
			if (!indexCompressor.ReadCommand()) {
				return false;
			}
			normals[pi * 3] = indexCompressor.rvalue;
		}

		var quant = 2 * Math.PI / nQuants;
		var alpha;
		var theta;
		var k;

		for (pi = 0; pi < pointCount; pi++) {
			if (!indexCompressor.ReadCommand()) {
				return false;
			}
			alpha = quant * normals[pi * 3];
			theta = quant * indexCompressor.rvalue;
			k = Math.sin(theta);

			normals[pi * 3] = k * Math.cos(alpha);
			normals[pi * 3 + 1] = k * Math.sin(alpha);
			normals[pi * 3 + 2] = Math.cos(theta);
		}

		return true;
	}

	function UnquantizeTexCoord(indexCompressor, pointCount, nQuants, uvs) {
		var quant = 1.0 / nQuants;
		for (var uv = 0; uv < 2; uv++) { // UUU, VVV
			for (var i = 0; i < pointCount; i++) {
				if (!indexCompressor.ReadCommand()) {
					return false;
				}
				uvs[i * 2 + uv] = quant * indexCompressor.rvalue;
			}
		}

		return true;
	}

	return GeometryFactory;
});
