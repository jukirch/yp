/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"./TotaraUtils",
	"./Command"
], function(
	TotaraUtils,
	Command
) {
	"use strict";

	function ResourceQueue(getBatchSize) {
		this.getBatchSize = getBatchSize;

		// This list (set) contains IDs which were ever requested, they can be not processed yet or
		// already processed.
		this.globalList = new Set();

		// This list (map) contains IDs which are requested and whose processing may have been
		// started but has not been finished yet.
		//
		// When fetchBatch is called it deletes the item from requestedList but keeps it in the waitingList
		// However, we need the requestData to figure out whether the request is part of the initialView
		// (determined by the isInitial property).
		// So, we make waitingList a map with id as key and requestData as val
		this.waitingList = new Map();

		// A list (Set) contains IDs which are requested but whose processing has not started yet.
		this.requestedList = new Set();

		//             ID is in these lists                 ID is in these lists                                ID is in this list
		//                     |                                     |                                                  |
		//                     v                                     v                                                  v
		//              | globalList    |                     | globalList  |                                     | globalList |
		// ID -> add -> | waitingList   | -> start request -> | waitingList | -> receive and finish processing -> |            |
		//              | requestedList |                     |             |                                     |            |
	}

	ResourceQueue.prototype.push = function(id, requestData) {
		if (this.globalList.has(id)) {
			return false;
		}

		this.globalList.add(id);
		this.waitingList.set(id, requestData);
		this.requestedList.add(id);

		return true;
	};

	ResourceQueue.prototype.setBatchSizeInfo = function(batchSizeInfo) {
		this.batchSizeInfo = batchSizeInfo;
	};

	ResourceQueue.prototype.fetchBatch = function() {
		var batchSize = this.getBatchSize ? this.getBatchSize : 1;
		if (typeof this.getBatchSize === "function") {
			batchSize = this.getBatchSize();
		}

		var batchSizeInfo = this.batchSizeInfo;
		var maxBatchStringLength = batchSizeInfo ? batchSizeInfo.maxBatchStringLength : Number.MAX_SAFE_INTEGER;
		var separatorLength = batchSizeInfo ? batchSizeInfo.separatorLength : 0;

		var batch = [];
		var batchStringLength = 0;

		var iterator = this.requestedList.keys();
		var entry = iterator.next();
		for (var i = 0; i < batchSize && !entry.done; i++, entry = iterator.next()) {
			var id = entry.value;
			batchStringLength += id.toString().length + (i == 0 ? 0 : separatorLength);

			if (batchStringLength > maxBatchStringLength) {
				break;
			}

			this.requestedList.delete(id);
			batch.push(id);
		}
		return batch;
	};

	ResourceQueue.prototype.pop = function(id) {
		this.requestedList.delete(id);
		return this.waitingList.delete(id);
	};

	ResourceQueue.prototype.isReady = function(id) {
		return this.globalList.has(id) && !this.waitingList.has(id);
	};

	ResourceQueue.prototype.clear = function(id) {
		this.globalList.clear();
		this.waitingList.clear();
		this.requestedList.clear();
	};

	ResourceQueue.prototype.isEmpty = function() {
		return this.requestedList.size === 0;
	};

	ResourceQueue.prototype.isWaiting = function() {
		return this.waitingList.size > 0;
	};

	ResourceQueue.prototype.isInitialViewCompleted = function() {
		var map = this.waitingList;
		for (var iterator = map.values(), entry = iterator.next(); !entry.done; entry = iterator.next()) {
			var value = entry.value;
			if (value && value.isInitial) {
				return false;
			}
		}
		return true;
	};

	function GeometryResourceQueue(getBatchSize, getMaxBatchDataSize) {
		ResourceQueue.call(this, getBatchSize);
		this.getMaxBatchDataSize = getMaxBatchDataSize;
		this.priorityMap = new Map();
		this.sortedList = null;
	}

	GeometryResourceQueue.prototype = Object.create(ResourceQueue.prototype);

	GeometryResourceQueue.prototype.constructor = GeometryResourceQueue;

	GeometryResourceQueue.prototype.push = function(id, requestData) {
		if (ResourceQueue.prototype.push.call(this, id, requestData)) {
			this.priorityMap.set(id, {});
			this.sortedList = null;
			return true;
		}

		return false;
	};

	GeometryResourceQueue.prototype.pop = function(id) {
		this.priorityMap.delete(id);
		return ResourceQueue.prototype.pop.call(this, id);
	};

	GeometryResourceQueue.prototype.clear = function() {
		ResourceQueue.prototype.clear.call(this);
		this.priorityMap.clear();
		this.sortedList = null;
	};

	GeometryResourceQueue.prototype.setData = function(id, data) {
		var value = this.priorityMap.get(id);
		if (value != null) {
			Object.assign(value, data);
			this.sortedList = null;
			return true;
		}
		return false;
	};

	GeometryResourceQueue.prototype.fetchBatch = function() {
		var priorityMap = this.priorityMap;
		var requestedList = this.requestedList;
		var sortedList = this.sortedList;

		if (sortedList == null) {
			sortedList = this.sortedList = Array.from(requestedList.keys()).sort(function(a, b) {
				// highest priority at the back, to be able to .pop() the array
				return priorityMap.get(a).priority - priorityMap.get(b).priority;
			});
		}

		var batchSizeInfo = this.batchSizeInfo;
		var maxBatchStringLength = batchSizeInfo ? batchSizeInfo.maxBatchStringLength : Number.MAX_SAFE_INTEGER;
		var maxBatchDataSize = this.getMaxBatchDataSize ? this.getMaxBatchDataSize() : 10 * 1024 * 1024;
		var maxBatchSubmeshCount = 1000;
		var separatorLength = batchSizeInfo ? batchSizeInfo.separatorLength : 0;

		var batch = [];
		var batchDataSize = 0;
		var batchSize = this.getBatchSize ? this.getBatchSize() : 1;
		var batchStringLength = 0;
		var batchSubmeshCount = 0;

		for (var i = 0; i < batchSize && sortedList.length > 0; i++) {
			var id = sortedList[sortedList.length - 1];
			var value = priorityMap.get(id);

			batchDataSize += value.dataSize;
			batchSubmeshCount += value.submeshCount;

			batchStringLength += id.toString().length + (i == 0 ? 0 : separatorLength);

			// The batch must have at least one item, so we test data size and submesh count only
			// for the second and subsequent items.
			if (i > 0 && (
				batchStringLength > maxBatchStringLength
				|| batchDataSize > maxBatchDataSize
				|| batchSubmeshCount > maxBatchSubmeshCount)
			) {
				break;
			}

			requestedList.delete(id);
			priorityMap.delete(id);
			sortedList.pop();
			batch.push(id);
		}

		return batch;
	};

	var RequestQueue = function(context, sceneId) {
		this.context = context; // SceneContext
		this.sceneId = sceneId;
		this.token = context.token || TotaraUtils.generateToken();
		var loader = context.loader;
		this.meshes = new ResourceQueue(loader.getMeshesBatchSize.bind(loader));
		this.materials = new ResourceQueue(loader.getMaterialsBatchSize.bind(loader));
		this.textures = new ResourceQueue();
		this.geomMeshes = new GeometryResourceQueue(loader.getGeomMeshesBatchSize.bind(loader), loader.getGeomMeshesMaxBatchDataSize.bind(loader));
		this.annotations = new ResourceQueue(loader.getAnnotationsBatchSize.bind(loader));
		this.views = new ResourceQueue();
		this.thumbnails = new ResourceQueue();
	};

	RequestQueue.prototype.isEmpty = function() {
		return this.meshes.isEmpty()
			&& this.annotations.isEmpty()
			&& this.materials.isEmpty()
			&& this.textures.isEmpty()
			&& this.geomMeshes.isEmpty()
			&& this.views.isEmpty()
			&& this.thumbnails.isEmpty();
	};

	RequestQueue.prototype.isWaitingForContent = function() {
		return this.meshes.isWaiting()
			|| this.textures.isWaiting()
			|| this.materials.isWaiting()
			|| this.geomMeshes.isWaiting()
			|| this.annotations.isWaiting()
			|| this.views.isWaiting()
			|| this.thumbnails.isWaiting();
	};

	RequestQueue.prototype.clearContent = function() {
		this.meshes.clear();
		this.annotations.clear();
		this.materials.clear();
		this.textures.clear();
		this.geomMeshes.clear();
		this.views.clear();
		this.thumbnails.clear();
	};

	RequestQueue.prototype.createGetContentCommand = function(commandName, ids, extraOptions) {
		var options = {
			sceneId: this.sceneId,
			ids: ids.map(function(id) { return parseInt(id, 10); }),
			token: this.token
		};
		return TotaraUtils.createRequestCommand(commandName, extraOptions ? Object.assign(options, extraOptions) : options);
	};

	function removeFirstFromMap(map) {
		var entry = map.keys().next();
		if (entry.done) {
			return null;
		}
		var value = entry.value;
		map.delete(value);
		return value;
	}

	RequestQueue.prototype.generateRequestCommand = function() {
		var id;
		var ids;
		var requestData;
		var command = null;
		if (!this.meshes.isEmpty()) {
			// This call is used to retrieve inner boxes only.
			ids = this.meshes.fetchBatch();
			var meshIds = ids.map(function(i) { return (i.id ? i.id : i); });
			command = this.createGetContentCommand(Command.getMesh, meshIds);
			command.sceneId = this.sceneId;
			command.meshIds = meshIds;
		} else if (!this.geomMeshes.isEmpty()) {
			ids = this.geomMeshes.fetchBatch();
			command = this.createGetContentCommand(Command.getGeomMesh, ids);
			command.sceneId = this.sceneId;
			command.meshIds = ids;
		} else if (!this.annotations.isEmpty()) {
			ids = this.annotations.fetchBatch();
			command = {
				method: Command.getAnnotation,
				parameters: {
					sceneId: this.sceneId,
					annotationIds: ids
				}
			};
		} else if (!this.materials.isEmpty()) {
			ids = this.materials.fetchBatch();
			command = {
				method: Command.getMaterial,
				parameters: {
					sceneId: this.sceneId,
					materialIds: ids
				}
			};
		} else if (!this.textures.isEmpty()) {
			id = removeFirstFromMap(this.textures.requestedList);
			requestData = this.textures.waitingList.get(id);
			command = this.createGetContentCommand(Command.getImage, [id]);
			command.sceneId = this.sceneId;
			command = Object.assign(command, requestData);
		} else if (!this.views.isEmpty()) {
			id = removeFirstFromMap(this.views.requestedList);
			command = {
				method: Command.getView,
				parameters: {
					sceneId: this.sceneId,
					viewId: id,
					query: TotaraUtils.configureSceneViewQuery(this.context)
				}
			};
		} else if (!this.thumbnails.isEmpty()) {
			id = removeFirstFromMap(this.thumbnails.requestedList);
			requestData = this.thumbnails.waitingList.get(id);
			command = this.createGetContentCommand(Command.getImage, [id]);
			command.sceneId = this.sceneId;
			command = Object.assign(command, requestData);
		}

		return command;
	};

	return RequestQueue;
});
