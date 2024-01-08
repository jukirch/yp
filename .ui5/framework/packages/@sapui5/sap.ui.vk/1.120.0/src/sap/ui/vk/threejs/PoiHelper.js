/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides PoiHelper class.

sap.ui.define([
	"../ContentConnector",
	"../ContentResource",
	"./ContentDeliveryService",
	"../NodeContentType",
	"../TransformationMatrix",
	"../thirdparty/three",
	"sap/base/assert",
	"sap/base/util/uid"
], function(
	ContentConnector,
	ContentResource,
	ContentDeliveryService,
	NodeContentType,
	TransformationMatrix,
	THREE,
	assert,
	uid
) {
	"use strict";

	var unitVector = new THREE.Vector3(1, 1, 1);

	// Remove all userData properties from three.js nodes except the skipIt property.
	function cleanUpUserData(child) {
		child.userData = { skipIt: true };
		child.children.forEach(cleanUpUserData);
	}

	var PoiHelper = function() {
		// In order to speed up creation of new markers/POIs when adding or changing a symbol we
		// store the downloaded symbol scenes in this cache and when a symbol scene is requested
		// next time we do not make the same requests to the storage service but instead clone the
		// symbol's sub-tree from this cache.
		//
		// Each element is { url, sceneId, rootNodeRef }.
		this._symbolSceneCache = [];
	};

	// Creates a top level symbol node and loads a symbol scene as its child.
	//
	// This method is called when we create a marker by right-clicking on an object and also by
	// undo/redo handlers.
	//
	// This method returns a promise which resolves with a structure similar to the response from
	// endpoint `authoring/v1/actions?name=createInfoPoiWithPos`.
	PoiHelper.prototype.createPOI = function(url, scene, poiSceneId, viewport, poiPosition, nodeInfo, getNearestEntityOrVisibleElementNodes) {
		viewport = viewport._implementation || viewport;
		if (!("sid" in nodeInfo)) {
			nodeInfo.sid = uid();
		}
		if (!("transform" in nodeInfo)) {
			// NB: nodeInfo.transform is null when we create the marker by right-click on an object.
			// If we create a marker in undo/redo handlers then nodeInfo.transform must not be null.
			assert(getNearestEntityOrVisibleElementNodes != null, "If nodeInfo.transform is not defined then getNearestEntityOrVisibleElementNodes must be defined.");

			var viewportRect = viewport.getDomRef().getBoundingClientRect();
			var screenX = poiPosition.x - viewportRect.left;
			var screenY = poiPosition.y - viewportRect.top;
			var hit = viewport.hitTest(screenX, screenY, { ignoreOverlay: true });
			if (hit == null) {
				return Promise.reject("Cannot locate an object for the marker.");
			}

			var matrix = new THREE.Matrix4().compose(hit.point, viewport._getNativeCamera().quaternion, unitVector);
			// To get closest ancestor entity nodes as references.
			var pickedNodes = getNearestEntityOrVisibleElementNodes(hit.object);
			var invertParent = pickedNodes.length > 0 ? new THREE.Matrix4().copy(pickedNodes[0].matrixWorld).invert() : new THREE.Matrix4();
			matrix.premultiply(invertParent);
			nodeInfo.transform = TransformationMatrix.convertTo4x3(matrix.elements);
			nodeInfo.referenceNode = (pickedNodes.length > 0 ? pickedNodes[0] : hit.object).userData.nodeId;
		}
		nodeInfo.transformType = "BILLBOARD_VIEW";

		var nodeHierarchy = scene.getDefaultNodeHierarchy();
		var symbolNode = nodeHierarchy.createNode(null, nodeInfo.name, null, NodeContentType.Symbol, nodeInfo);
		var view = viewport.getCurrentView() || scene.getViews()[0];

		return this.loadSymbolScene(url, poiSceneId).then(function(rootNodeRef) {
			var entityId = rootNodeRef.userData.entityId;
			symbolNode.add.apply(symbolNode, rootNodeRef.children);
			symbolNode.children.forEach(cleanUpUserData);
			symbolNode.userData.treeNode.entityId = entityId;
			view.updateNodeInfos([{ target: symbolNode, visible: true, transform: nodeInfo.transform }]);
			viewport.setShouldRenderFrame();
			return {
				transform: nodeInfo.transform.slice(),
				veId: nodeInfo.sid,
				entityId: entityId,
				name: nodeInfo.name,
				transformType: "BILLBOARD_VIEW",
				contentType: "SYMBOL",
				referenceNode: nodeInfo.referenceNode,
				symbolNode: symbolNode
			};
		});
	};

	// This method is called when we update a marker by right-clicking on it or by moving it, and
	// also by undo/redo handlers.
	PoiHelper.prototype.updatePOI = function(url, scene, viewport, symbolNodeSid, poiSceneId, nodeInfo) {
		var symbolNode = scene.persistentIdToNodeRef(symbolNodeSid);
		if ("name" in nodeInfo) {
			symbolNode.name = nodeInfo.name;
		}
		if ("transform" in nodeInfo) {
			symbolNode.position.set(nodeInfo.transform[9], nodeInfo.transform[10], nodeInfo.transform[11]);
		}
		if (poiSceneId) {
			var nodeHierarchy = scene.getDefaultNodeHierarchy();
			nodeHierarchy.removeNode(symbolNode.children);
			return this.loadSymbolScene(url, poiSceneId).then(function(rootNodeRef) {
				// We do not create a new symbol node but instead we re-use the existing one. Child
				// nodes are removed above. Here we add child nodes from the loaded scene and also
				// assign entityId to userData.treeNode.entityId as if the node were loaded as part
				// of the current scene.
				var entityId = rootNodeRef.userData.entityId;
				symbolNode.add.apply(symbolNode, rootNodeRef.children);
				symbolNode.children.forEach(cleanUpUserData);
				symbolNode.userData._symbolCenterFixed = false; // HACK: center symbol geometry; do we still need this?
				symbolNode.userData.treeNode.entityId = entityId;
				viewport.setShouldRenderFrame();
				return entityId;
			});
		} else {
			viewport.setShouldRenderFrame();
			return Promise.resolve(symbolNode.userData.treeNode.entityId);
		}
	};

	PoiHelper.prototype.removePOI = function(scene, nodeRef) {
		var nodeHierarchy = scene.getDefaultNodeHierarchy();
		var vsm = scene.getViewStateManager();
		vsm.setVisibilityState(nodeRef, false, true);

		// Undo create gives single node, while undo delete gives an array.
		var nodeRefArray = Array.isArray(nodeRef) ? nodeRef : [nodeRef];
		if (nodeRefArray && nodeRefArray.length) {
			nodeRefArray.forEach(function(node) {
				var nodeId = node.userData.nodeId;
				var referenceNode = scene.getReferenceNodeFromMarkerNodeId(nodeId);
				if (referenceNode) {
					scene.unbindMarkerNodeTransformationFromReferenceNode(referenceNode.userData.nodeId, nodeId);
				}
			});
		}
		nodeHierarchy.removeNode(nodeRef);
	};

	PoiHelper.prototype.getPoiRect = function(viewport, nodeRef) {
		var camera = viewport._getNativeCamera();
		var boundingBox = new THREE.Box3();
		boundingBox.setFromObject(nodeRef);
		var vertices = [
			new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.min.z),
			new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z),
			new THREE.Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.max.z),
			new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.max.z),
			new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.max.z),
			new THREE.Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.min.z),
			new THREE.Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.min.z),
			new THREE.Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.min.z)
		];

		var frustum = new THREE.Frustum();
		frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
		if (!frustum.intersectsBox(boundingBox)) { return false; }

		var min = new THREE.Vector3(1, 1, 1);
		var max = new THREE.Vector3(-1, -1, -1);
		var vertex = new THREE.Vector3();
		for (var i = 0; i < vertices.length; ++i) {
			if (!frustum.containsPoint(vertices[i])) { return false; }
			var vertexWorldCoord = vertex.copy(vertices[i]);
			var vertexScreenSpace = vertexWorldCoord.project(camera);
			min.min(vertexScreenSpace);
			max.max(vertexScreenSpace);
		}

		var box2 = new THREE.Box2(min, max);
		var viewportRect = viewport.getDomRef().getBoundingClientRect();
		var halfScreen = new THREE.Vector2(viewportRect.width / 2, viewportRect.height / 2);
		var box2min = box2.min.clone().multiply(halfScreen);
		var box2max = box2.max.clone().multiply(halfScreen);
		var width = box2max.x - box2min.x;
		var height = box2max.y - box2min.y;
		return { width: width, height: height };
	};

	PoiHelper.prototype.adjustPoi = function(viewport, poiNodeRef) {
		if (viewport.getBackgroundProjection() !== "planar") {
			var screenPos = poiNodeRef.getWorldPosition(new THREE.Vector3()).project(viewport._getNativeCamera());
			var hit = viewport.hitTest((screenPos.x * 0.5 + 0.5) * viewport._width, (screenPos.y * -0.5 + 0.5) * viewport._height, { ignoreOverlay: true });
			if (hit) {
				poiNodeRef.position.copy(hit.point);
			}
			poiNodeRef.quaternion.copy(viewport._getNativeCamera().quaternion);
			poiNodeRef.updateMatrix();
			poiNodeRef.updateMatrixWorld();
			poiNodeRef.userData.direction = new THREE.Vector3().setFromMatrixColumn(poiNodeRef.matrixWorld, 2).normalize();
		}

		poiNodeRef.userData.transform = TransformationMatrix.convertTo4x3(poiNodeRef.matrix.elements);
	};

	PoiHelper.prototype.updateNodeId = function(scene, nodeId, newNodeId) {
		var poiNode = scene.persistentIdToNodeRef(nodeId);
		if (poiNode != null) {
			var referenceNode = scene.getReferenceNodeFromMarkerNodeId(nodeId);
			if (referenceNode) {
				scene.unbindMarkerNodeTransformationFromReferenceNode(referenceNode.userData.nodeId, nodeId);
				scene.bindMarkerNodeTransformationToReferenceNode(referenceNode.userData.nodeId, newNodeId);
			}

			scene.setNodePersistentId(poiNode, newNodeId);
		}
		return poiNode;
	};

	PoiHelper.prototype.findSymbolSceneInCache = function(url, sceneId) {
		return this._symbolSceneCache.find(function(item) { return item.url === url && item.sceneId === sceneId; });
	};

	/**
	 * Load a symbol scene.
	 *
	 * @param {string} url The storage service base URL.
	 * @param {string} sceneId The symbol scene ID.
	 * @returns {Promise} A promise resolved with <code>rootNodeRef</code> - the root node of the
	 *     loaded scene. If loading failed the promise is rejected with an <code>error</code>
	 *     object.
	 */
	PoiHelper.prototype.loadSymbolScene = function(url, sceneId) {
		var cacheEntry = this.findSymbolSceneInCache(url, sceneId);

		if (cacheEntry != null) {
			return Promise.resolve(cacheEntry.rootNodeRef.clone());
		}

		return new Promise(function(resolve, reject) {
			// A unique source type for the content resource. This unique source type is used to
			// register the content manager resolver. We have to register a unique content manager
			// resolver because it is registered globally as the addContentManagerResolver method of
			// class ContentConnector is static. This could be changed in future if we add instance
			// version addContentManagerResolver to the ContentConnector class.
			var sourceType = "marker-" + uid();

			var contentResource = new ContentResource({
				sourceType: sourceType,
				source: url,
				veid: sceneId,
				sourceId: "abc"
			});

			// We use a clean content connector and a loader to load the symbol scene.
			var contentConnector = new ContentConnector();
			var cds = new ContentDeliveryService();

			// This function is called when loading the symbol scene finishes (successfully or not).
			var cleanup = function() {
				// We won't re-use this unique source type. When a new symbol scene is requested we
				// will create a new unique source type.
				ContentConnector.removeContentManagerResolver(sourceType);

				// We use setTimeout to call this code in the next event loop iteration because the
				// current code is executed in the cds's callback.
				setTimeout(function() {
					contentConnector.destroy();
					cds.destroy();
				}, 0);
			};

			cds.attachEventOnce(
				"sceneCompleted",
				function() {
					var rootNodeRef = contentResource.getNodeProxy().getNodeRef();

					// The symbol scene could be requested before the previous request for the same
					// scene has finished. This may happen if we deleted multiple markers with the
					// same symbol, reloaded the application and clicked undo. So, we have to check
					// if the scene is already cached.
					if (this.findSymbolSceneInCache(url, sceneId) == null) {
						// We store a cloned copy in the cache because the original one will be
						// removed when the content connector is destroyed.
						this._symbolSceneCache.push({
							url: url,
							sceneId: sceneId,
							rootNodeRef: rootNodeRef.clone()
						});
					}

					resolve(rootNodeRef.clone());

					cleanup();
				},
				this
			);

			cds.attachEventOnce(
				"errorReported",
				function(event) {
					reject(event.getParameter("error"));
					cleanup();
				}
			);

			ContentConnector.addContentManagerResolver({
				pattern: sourceType,
				dimension: 3,
				contentManagerClassName: "sap.ui.vk.threejs.ContentManager",
				settings: {
					loader: cds
				}
			});

			contentConnector.addContentResource(contentResource);
		}.bind(this));
	};

	return PoiHelper;
});
