/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/ActivityBase", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/converters/MetaModelConverter", "sap/m/MessageBox"], function (Log, CommonUtils, ActivityBase, CollaborationCommon, MetaModelConverter, MessageBox) {
  "use strict";

  var _exports = {};
  var getActivityKeyFromPath = CollaborationCommon.getActivityKeyFromPath;
  var CollaborationUtils = CollaborationCommon.CollaborationUtils;
  var Activity = CollaborationCommon.Activity;
  var isCollaborationConnected = ActivityBase.isCollaborationConnected;
  var initializeCollaboration = ActivityBase.initializeCollaboration;
  var endCollaboration = ActivityBase.endCollaboration;
  var broadcastCollaborationMessage = ActivityBase.broadcastCollaborationMessage;
  const MYACTIVITIES = "/collaboration/myActivities";
  const ACTIVEUSERS = "/collaboration/activeUsers";
  const ACTIVITIES = "/collaboration/activities";
  const ASYNCMESSAGESQUEUE = "/collaboration/asyncMsgQueue";
  const RETAINEDASYNCMESSAGES = "/collaboration/retainedMessages";
  const ASYNCMESSAGESTIMERID = "/collaboration/asyncMsgTimerId";
  const SYNCGROUPID = "$auto.sync";
  const DELAYONFOCUS = 500; // 500ms delay for async LOCK/UNLOCK messages

  /**
   * Checks if a given path is locked by the current user.
   *
   * @param activityModel
   * @param activityPath
   * @returns True if the path is locked
   */
  function checkPathForLock(activityModel, activityPath) {
    const myActivities = activityModel.getProperty(MYACTIVITIES);
    if (!myActivities) {
      return false;
    } else {
      return myActivities.includes(activityPath);
    }
  }

  /**
   * Sets a path as locked for the current user.
   *
   * @param activityModel
   * @param activityPath
   */
  function setLock(activityModel, activityPath) {
    const myActivities = activityModel.getProperty(MYACTIVITIES) ?? [];
    if (!myActivities.includes(activityPath)) {
      myActivities.push(activityPath);
    }
    activityModel.setProperty(MYACTIVITIES, myActivities);
  }

  /**
   * Removes the lock for a given path.
   *
   * @param activityModel
   * @param activityPaths
   * @returns True if the path was previously locked
   */
  function removeLock(activityModel, activityPaths) {
    const myActivities = activityModel.getProperty(MYACTIVITIES);
    if (!myActivities || activityPaths === undefined) {
      return false;
    }
    const pathsToRemove = Array.isArray(activityPaths) ? activityPaths : [activityPaths];
    const myNewActivities = myActivities.filter(activity => {
      return !pathsToRemove.includes(activity);
    });
    activityModel.setProperty(MYACTIVITIES, myNewActivities);
    return myNewActivities.length !== myActivities.length;
  }

  /**
   * Returns all locked paths for the current user.
   *
   * @param activityModel
   * @returns Concatenated paths for all locked properties
   */
  function getLockedProperties(activityModel) {
    const myActivities = activityModel.getProperty(MYACTIVITIES);
    if (!myActivities) {
      return undefined;
    } else {
      return myActivities.join("|");
    }
  }

  /**
   * Updates all current locks by changing a context path.
   * This is called when activating a context, where the initial locks were using the transient path
   * and need to be updated with the actual path.
   *
   * @param element
   * @param oldContextPath
   * @param newContextPath
   */
  function updateLocksForContextPath(element, oldContextPath, newContextPath) {
    if (!isConnected(element)) {
      return;
    }
    const internalModel = element.getModel("internal");

    // Replace paths in pending async messages
    const currentQueue = internalModel.getProperty(ASYNCMESSAGESQUEUE);
    currentQueue.forEach(queueItem => {
      if (queueItem.path.startsWith(oldContextPath)) {
        queueItem.path = queueItem.path.replace(oldContextPath, newContextPath);
      }
    });

    // Replace paths in existing locks (and broadcast the corresponding message if necessary)
    const myActivities = internalModel.getProperty(MYACTIVITIES);
    if (myActivities) {
      const changedActivities = [];
      const unchangedActivities = [];
      myActivities.forEach(lockedPath => {
        if (lockedPath.startsWith(oldContextPath)) {
          // Replace the path in the list of locks, and store this path for sending a new LOCK message
          const newlockedPath = lockedPath.replace(oldContextPath, newContextPath);
          changedActivities.push(newlockedPath);
        } else {
          unchangedActivities.push(lockedPath);
        }
      });
      internalModel.setProperty(MYACTIVITIES, unchangedActivities);
      if (changedActivities.length !== 0) {
        send(element, {
          action: Activity.Lock,
          content: changedActivities
        });
      }
    }
  }

  /**
   * Resets the timer for sending asynchronous collaboration messages.
   *
   * @param internalModel
   */
  _exports.updateLocksForContextPath = updateLocksForContextPath;
  function resetAsyncMessagesTimer(internalModel) {
    let timerId = internalModel.getProperty(ASYNCMESSAGESTIMERID);
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      const queue = internalModel.getProperty(ASYNCMESSAGESQUEUE);
      const newQueue = [];
      const pathsToRetain = internalModel.getProperty(RETAINEDASYNCMESSAGES) ?? [];
      if (!queue) {
        return;
      }
      queue.forEach(item => {
        if (pathsToRetain.includes(item.path)) {
          newQueue.push(item);
        } else {
          doSend(internalModel, item.action, item.path);
        }
      });
      internalModel.setProperty(ASYNCMESSAGESQUEUE, newQueue);
      internalModel.setProperty(ASYNCMESSAGESTIMERID, undefined);
      if (newQueue.length) {
        // If some messages are still pending, reschedule a new timer
        resetAsyncMessagesTimer(internalModel);
      }
    }, DELAYONFOCUS);
    internalModel.setProperty(ASYNCMESSAGESTIMERID, timerId);
  }

  /**
   * Mark some paths as being retained, i.e. async messages for these paths won't be sent but kept until they're released.
   * This applies to existing async messages in the queue, but also to future messages.
   *
   * @param element
   * @param activityPaths The paths to be retained
   */
  function retainAsyncMessages(element, activityPaths) {
    const internalModel = element.getModel("internal");
    const additionalPathsToRetain = Array.isArray(activityPaths) ? activityPaths : [activityPaths];
    const retainedPaths = internalModel.getProperty(RETAINEDASYNCMESSAGES);
    additionalPathsToRetain.forEach(path => {
      if (!retainedPaths.includes(path)) {
        retainedPaths.push(path);
      }
    });
  }

  /**
   * Release async messages for some paths that were previously retained.
   * The corresponding messages are not sent immediately, but the next time the async timer wakes up.
   *
   * @param element
   * @param activityPaths The paths to be released
   */
  _exports.retainAsyncMessages = retainAsyncMessages;
  function releaseAsyncMessages(element, activityPaths) {
    const internalModel = element.getModel("internal");
    const pathsToRetain = internalModel.getProperty(RETAINEDASYNCMESSAGES);
    const pathsToRelease = Array.isArray(activityPaths) ? activityPaths : [activityPaths];
    internalModel.setProperty(RETAINEDASYNCMESSAGES, pathsToRetain.filter(retainedPath => {
      return !pathsToRelease.includes(retainedPath);
    }));
  }

  /**
   * Checks if a collaboration session is currently open.
   *
   * @param element
   * @returns True if a collaboration session is currently open.
   */
  _exports.releaseAsyncMessages = releaseAsyncMessages;
  const isConnected = function (element) {
    const internalModel = element.getModel("internal");
    return isCollaborationConnected(internalModel);
  };

  /**
   * Sends a collaboration message to other connected users.
   *
   * @param element
   * @param message
   * @param message.action
   * @param message.content
   * @param message.triggeredActionName
   * @param message.refreshListBinding
   * @param message.actionRequestedProperties
   */
  _exports.isConnected = isConnected;
  const send = function (element, message) {
    if (isConnected(element)) {
      const internalModel = element.getModel("internal");
      if (message.action === Activity.Lock || message.action === Activity.Unlock) {
        // Lock-related events are always sent with some delay
        doSendAsync(internalModel, message.action, message.content);
      } else {
        doSend(internalModel, message.action, message.content, message.triggeredActionName, message.refreshListBinding, message.actionRequestedProperties);
      }
    }
  };

  /**
   * Internal function to send a collaboration message immediately.
   *
   * @param internalModel
   * @param action
   * @param content
   * @param triggeredActionName
   * @param refreshListBinding
   * @param actionRequestedProperties
   */
  _exports.send = send;
  function doSend(internalModel, action, content, triggeredActionName, refreshListBinding, actionRequestedProperties) {
    const clientContent = (Array.isArray(content) ? content.join("|") : content) ?? "";
    const requestedProperties = actionRequestedProperties === null || actionRequestedProperties === void 0 ? void 0 : actionRequestedProperties.join("|");
    if (action === Activity.Lock) {
      const pathForLock = (Array.isArray(content) ? content[0] : content) ?? "";
      // To avoid unnecessary traffic we keep track of lock changes and send it only once
      if (checkPathForLock(internalModel, pathForLock)) {
        return;
      } else {
        setLock(internalModel, pathForLock);
      }
    } else if (action === Activity.Unlock) {
      const removed = removeLock(internalModel, content);
      // No need to send an Unlock message if it was not already locked
      if (!removed) {
        return;
      }
    }
    broadcastCollaborationMessage(action, clientContent, internalModel, triggeredActionName, refreshListBinding, requestedProperties);
  }

  /**
   * Internal function to send a collaboration message asynchronously.
   *
   * @param internalModel
   * @param action
   * @param content
   */
  function doSendAsync(internalModel, action, content) {
    if (content === undefined) {
      return;
    }
    const currentQueue = internalModel.getProperty(ASYNCMESSAGESQUEUE);
    const pathsToAdd = Array.isArray(content) ? content : [content];
    // Remove existing items in the queue for the paths that will be added
    const newQueue = currentQueue.filter(item => {
      return !pathsToAdd.includes(item.path);
    });
    pathsToAdd.forEach(path => {
      newQueue.push({
        path,
        action
      });
    });
    internalModel.setProperty(ASYNCMESSAGESQUEUE, newQueue);
    resetAsyncMessagesTimer(internalModel);
  }
  const getWebSocketBaseURL = function (bindingContext) {
    return bindingContext.getModel().getMetaModel().getObject("/@com.sap.vocabularies.Common.v1.WebSocketBaseURL");
  };
  const isCollaborationEnabled = function (view) {
    const bindingContext = (view === null || view === void 0 ? void 0 : view.getBindingContext) && view.getBindingContext();
    return !!(bindingContext && getWebSocketBaseURL(bindingContext));
  };
  _exports.isCollaborationEnabled = isCollaborationEnabled;
  const connect = async function (view) {
    const internalModel = view.getModel("internal");
    const me = CollaborationUtils.getMe(view);

    // Retrieving ME from shell service
    if (!me) {
      // no me = no shell = not sure what to do
      return;
    }
    const bindingContext = view.getBindingContext();
    const webSocketBaseURL = getWebSocketBaseURL(bindingContext);
    const serviceUrl = bindingContext.getModel().getServiceUrl();
    if (!webSocketBaseURL) {
      return;
    }
    const sDraftUUID = await bindingContext.requestProperty("DraftAdministrativeData/DraftUUID");
    if (!sDraftUUID) {
      return;
    }
    const initialized = initializeCollaboration(me, webSocketBaseURL, sDraftUUID, serviceUrl, internalModel, message => {
      messageReceive(message, view);
    }, view);
    if (initialized) {
      internalModel.setProperty(MYACTIVITIES, []);
      internalModel.setProperty(ASYNCMESSAGESQUEUE, []);
      internalModel.setProperty(RETAINEDASYNCMESSAGES, []);
    }
  };
  _exports.connect = connect;
  const disconnect = function (element) {
    const internalModel = element.getModel("internal");
    endCollaboration(internalModel);
  };

  /**
   * Callback when a message is received from the websocket.
   *
   * @param message The message received
   * @param view The view that was used initially when connecting the websocket
   */
  _exports.disconnect = disconnect;
  function messageReceive(message, view) {
    var _activities, _activities2;
    const internalModel = view.getModel("internal");
    let activeUsers = internalModel.getProperty(ACTIVEUSERS);
    let activities;
    let activityKey;
    const metaPath = calculateMetaPath(view, message.clientContent);
    message.userAction = message.userAction || message.clientAction;
    const sender = {
      id: message.userID,
      name: message.userDescription,
      initials: CollaborationUtils.formatInitials(message.userDescription),
      color: CollaborationUtils.getUserColor(message.userID, activeUsers, [])
    };
    let mactivity = sender;

    // eslint-disable-next-line default-case
    switch (message.userAction) {
      case Activity.Join:
      case Activity.JoinEcho:
        if (activeUsers.findIndex(user => user.id === sender.id) === -1) {
          activeUsers.unshift(sender);
          internalModel.setProperty(ACTIVEUSERS, activeUsers);
        }
        if (message.userAction === Activity.Join) {
          // we echo our existence to the newly entered user and also send the current activity if there is any
          broadcastCollaborationMessage(Activity.JoinEcho, getLockedProperties(internalModel), internalModel);
        }
        if (message.userAction === Activity.JoinEcho) {
          if (message.clientContent) {
            // another user was already typing therefore I want to see his activity immediately. Calling me again as a live change
            message.userAction = Activity.Lock;
            messageReceive(message, view);
          }
        }
        break;
      case Activity.Leave:
        // Removing the active user. Not removing "me" if I had the screen open in another session
        activeUsers = activeUsers.filter(user => user.id !== sender.id || user.me);
        internalModel.setProperty(ACTIVEUSERS, activeUsers);
        const allActivities = internalModel.getProperty(ACTIVITIES) || {};
        const removeUserActivities = function (bag) {
          if (Array.isArray(bag)) {
            return bag.filter(activity => activity.id !== sender.id);
          } else {
            for (const p in bag) {
              bag[p] = removeUserActivities(bag[p]);
            }
            return bag;
          }
        };
        removeUserActivities(allActivities);
        internalModel.setProperty(ACTIVITIES, allActivities);
        break;
      case Activity.Change:
        updateOnChange(view, message);
        break;
      case Activity.Create:
        // For create we actually just need to refresh the table
        updateOnCreate(view, message);
        break;
      case Activity.Delete:
        // For now also refresh the page but in case of deletion we need to inform the user
        updateOnDelete(view, message);
        break;
      case Activity.Activate:
        draftClosedByOtherUser(view, message.clientContent, CollaborationUtils.getText("C_COLLABORATIONDRAFT_ACTIVATE", sender.name));
        break;
      case Activity.Discard:
        draftClosedByOtherUser(view, message.clientContent, CollaborationUtils.getText("C_COLLABORATIONDRAFT_DISCARD", sender.name));
        break;
      case Activity.Action:
        updateOnAction(view, message);
        break;
      case Activity.Lock:
        mactivity = sender;
        mactivity.key = getActivityKeyFromPath(message.clientContent);

        // stupid JSON model...
        let initJSONModel = "";
        const parts = metaPath.split("/");
        for (let i = 1; i < parts.length - 1; i++) {
          initJSONModel += `/${parts[i]}`;
          if (!internalModel.getProperty(ACTIVITIES + initJSONModel)) {
            internalModel.setProperty(ACTIVITIES + initJSONModel, {});
          }
        }
        activities = internalModel.getProperty(ACTIVITIES + metaPath);
        activities = (_activities = activities) !== null && _activities !== void 0 && _activities.slice ? activities.slice() : [];
        activities.push(mactivity);
        internalModel.setProperty(ACTIVITIES + metaPath, activities);
        break;
      case Activity.Unlock:
        // The user did a change but reverted it, therefore unblock the control
        activities = internalModel.getProperty(ACTIVITIES + metaPath);
        activityKey = getActivityKeyFromPath(message.clientContent);
        internalModel.setProperty(ACTIVITIES + metaPath, (_activities2 = activities) === null || _activities2 === void 0 ? void 0 : _activities2.filter(a => a.key !== activityKey));
        break;
    }
  }

  /**
   * Displays a message that the current draft was closed be another user, and navigates back to a proper view.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param path The path of the context to navigate to
   * @param messageText The message to display
   */
  function draftClosedByOtherUser(view, path, messageText) {
    disconnect(view);
    MessageBox.information(messageText);
    view.getBindingContext().getBinding().resetChanges().then(function () {
      navigate(path, view);
    }).catch(function () {
      Log.error("Pending Changes could not be reset - still navigating to active instance");
      navigate(path, view);
    });
  }

  /**
   * Updates data when a CHANGE message has been received.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param message The message received from the websocket
   */
  function updateOnChange(view, message) {
    const updatedObjectsPaths = message.clientContent.split("|");
    const metaModel = view.getModel().getMetaModel();
    const internalModel = view.getModel("internal");
    const currentPage = getCurrentPage(view);
    const currentContext = currentPage.getBindingContext();
    const requestPromises = updatedObjectsPaths.map(async path => applyUpdatesForChange(view, path));

    // Simulate any change so the edit flow shows the draft indicator and sets the page to dirty
    currentPage.getController().editFlow.updateDocument(currentContext, Promise.all(requestPromises));
  }

  /**
   * Updates data corresponding to a path.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param propertyPathForUpdate Absolute path to the updated property
   * @returns A promise resolved when the data and its related side effects have been received
   */
  async function applyUpdatesForChange(view, propertyPathForUpdate) {
    const metaModel = view.getModel().getMetaModel();
    const metaContext = metaModel.getMetaContext(propertyPathForUpdate);
    const dataModelObject = MetaModelConverter.getInvolvedDataModelObjects(metaContext);
    const targetContextPath = propertyPathForUpdate.substring(0, propertyPathForUpdate.lastIndexOf("/")); // Remove property name
    const targetContext = findContextForUpdate(view, targetContextPath);
    const parentCollectionPath = targetContextPath.substring(0, targetContextPath.lastIndexOf("("));
    const parentContextPath = parentCollectionPath.substring(0, parentCollectionPath.lastIndexOf("/"));
    const parentContext = parentContextPath ? findContextForUpdate(view, parentContextPath) : undefined;
    if (!targetContext && !parentContext) {
      return; // No context for update
    }

    try {
      const sideEffectsPromises = [];
      const sideEffectsService = CollaborationUtils.getAppComponent(view).getSideEffectsService();
      if (targetContext) {
        // We have a target context, so we can retrieve the updated property
        const targetMetaPath = metaModel.getMetaPath(targetContext.getPath());
        const relativeMetaPathForUpdate = metaModel.getMetaPath(propertyPathForUpdate).replace(targetMetaPath, "").slice(1);
        sideEffectsPromises.push(sideEffectsService.requestSideEffects([relativeMetaPathForUpdate], targetContext, SYNCGROUPID));
      }

      // Get the fieldGroupIds corresponding to pathForUpdate
      const fieldGroupIds = sideEffectsService.computeFieldGroupIds(dataModelObject.targetEntityType.fullyQualifiedName, dataModelObject.targetObject.fullyQualifiedName);

      // Execute the side effects for the fieldGroupIds
      if (fieldGroupIds.length) {
        const pageController = view.getController();
        const sideEffectsMapForFieldGroup = pageController._sideEffects.getSideEffectsMapForFieldGroups(fieldGroupIds, targetContext || parentContext);
        Object.keys(sideEffectsMapForFieldGroup).forEach(sideEffectName => {
          const sideEffect = sideEffectsMapForFieldGroup[sideEffectName];
          sideEffectsPromises.push(pageController._sideEffects.requestSideEffects(sideEffect.sideEffects, sideEffect.context, SYNCGROUPID, undefined, true));
        });
      }
      await Promise.all(sideEffectsPromises);
    } catch (err) {
      Log.error("Failed to update data after change:" + err);
      throw err;
    }
  }

  /**
   * Updates data when a DELETE message has been received.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param message The message received from the websocket
   */
  function updateOnDelete(view, message) {
    const currentPage = getCurrentPage(view);
    const currentContext = currentPage.getBindingContext();
    const currentPath = currentContext.getPath();
    const deletedObjectPaths = message.clientContent.split("|");

    // check if user currently displays a deleted object or one of its descendants
    const deletedPathInUse = deletedObjectPaths.find(deletedPath => currentPath.startsWith(deletedPath));
    if (deletedPathInUse) {
      // any other user deleted the object I'm currently looking at. Inform the user we will navigate to root now
      MessageBox.information(CollaborationUtils.getText("C_COLLABORATIONDRAFT_DELETE", message.userDescription), {
        onClose: () => {
          // We retrieve the deleted context as a keep-alive, and disable its keepalive status,
          // so that it is properly destroyed when refreshing data
          const targetContext = currentContext.getModel().getKeepAliveContext(deletedPathInUse);
          targetContext.setKeepAlive(false);
          const requestPromise = applyUpdatesForCollection(view, deletedObjectPaths[0]);
          currentPage.getController().editFlow.updateDocument(currentPage.getBindingContext(), requestPromise);
          currentPage.getController()._routing.navigateBackFromContext(targetContext);
        }
      });
    } else {
      const requestPromise = applyUpdatesForCollection(view, deletedObjectPaths[0]);
      currentPage.getController().editFlow.updateDocument(currentPage.getBindingContext(), requestPromise);
    }
  }

  /**
   * Updates data when a CREATE message has been received.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param message The message received from the websocket
   */
  function updateOnCreate(view, message) {
    const currentPage = getCurrentPage(view);
    const createdObjectPaths = message.clientContent.split("|");
    const requestPromise = applyUpdatesForCollection(view, createdObjectPaths[0]);
    // Simulate a change so the edit flow shows the draft indicator and sets the page to dirty
    currentPage.getController().editFlow.updateDocument(currentPage.getBindingContext(), requestPromise);
  }

  /**
   * Updates data in a collection.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param pathInCollection A path to an entity in the collection
   */
  async function applyUpdatesForCollection(view, pathInCollection) {
    const appComponent = CollaborationUtils.getAppComponent(view);
    const parentPath = pathInCollection.substring(0, pathInCollection.lastIndexOf("/"));
    const parentContext = findContextForUpdate(view, parentPath);
    if (parentContext) {
      try {
        const sideEffectsPromises = [];
        const metaModel = parentContext.getModel().getMetaModel();
        const metaPathForUpdate = metaModel.getMetaPath(pathInCollection);
        const parentMetaPath = metaModel.getMetaPath(parentContext.getPath());
        const relativePath = metaPathForUpdate.replace(`${parentMetaPath}/`, "");

        // Reload the collection
        const sideEffectsService = appComponent.getSideEffectsService();
        sideEffectsPromises.push(sideEffectsService.requestSideEffects([relativePath], parentContext, SYNCGROUPID));

        // Request the side effects for the collection
        sideEffectsPromises.push(sideEffectsService.requestSideEffectsForNavigationProperty(relativePath, parentContext, SYNCGROUPID, true));
        await Promise.all(sideEffectsPromises);
      } catch (err) {
        Log.error("Failed to update data after collection update:" + err);
      }
    }
  }

  /**
   * Updates data when a ACTION message has been received.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param message The message received from the websocket
   */
  function updateOnAction(view, message) {
    var _message$clientReques;
    const currentPage = getCurrentPage(view);
    const pathsForAction = message.clientContent.split("|");
    const actionName = message.clientTriggeredActionName || "";
    const requestedProperties = (_message$clientReques = message.clientRequestedProperties) === null || _message$clientReques === void 0 ? void 0 : _message$clientReques.split("|");
    const refreshListBinding = message.clientRefreshListBinding === "true";
    let requestPromises = [];
    if (refreshListBinding) {
      requestPromises.push(applyUpdatesForCollection(view, pathsForAction[0]));
    } else {
      requestPromises = pathsForAction.map(path => requestUpdateForAction(view, path, actionName, requestedProperties));
    }

    // Simulate any change so the edit flow shows the draft indicator and sets the page to dirty
    currentPage.getController().editFlow.updateDocument(currentPage.getBindingContext(), Promise.all(requestPromises));
  }

  /**
   * Updates side-effects data when an action has been triggered on a context.
   *
   * @param view The view that was used initially when connecting the websocket
   * @param pathForAction Path of the context to apply the action to
   * @param actionName Name of the action
   * @param requestedProperties
   * @returns Promise resolved when the side-effects data has been loaded
   */
  async function requestUpdateForAction(view, pathForAction, actionName, requestedProperties) {
    const targetContext = findContextForUpdate(view, pathForAction);
    if (!targetContext) {
      return;
    }
    const appComponent = CollaborationUtils.getAppComponent(view);
    const sideEffectService = appComponent.getSideEffectsService();
    const sideEffectsFromAction = sideEffectService.getODataActionSideEffects(actionName, targetContext);
    const sideEffectPromises = [];
    if (sideEffectsFromAction) {
      var _sideEffectsFromActio;
      if ((_sideEffectsFromActio = sideEffectsFromAction.pathExpressions) !== null && _sideEffectsFromActio !== void 0 && _sideEffectsFromActio.length) {
        sideEffectPromises.push(sideEffectService.requestSideEffects(sideEffectsFromAction.pathExpressions, targetContext, SYNCGROUPID));
      }
    }
    if (requestedProperties && requestedProperties.length > 0) {
      //clean-up of the properties to request list:
      const metaModel = view.getModel().getMetaModel();
      const metaPathForAction = calculateMetaPath(view, pathForAction);
      const dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(metaPathForAction));
      const propertiesToRequest = dataModelPath.targetEntityType.entityProperties.map(property => {
        return property.name;
      }).filter(prop => requestedProperties.includes(prop));
      if (propertiesToRequest.length > 0) {
        sideEffectPromises.push(sideEffectService.requestSideEffects(propertiesToRequest, targetContext, SYNCGROUPID));
      }
    }
    await Promise.all(sideEffectPromises);
  }

  /**
   * Finds a context to apply an update message (CHANGE, CREATE, DELETE or ACTION).
   *
   * @param view  The view that was used initially when connecting the websocket
   * @param path The path of the context to be found (shall point to an entity, not a property)
   * @returns A context if it could be found
   */
  function findContextForUpdate(view, path) {
    if (!path) {
      return undefined;
    }
    // Find all potential paths
    const targetPaths = [];
    while (!path.endsWith(")")) {
      targetPaths.unshift(path);
      path = path.substring(0, path.lastIndexOf("/"));
    }
    targetPaths.unshift(path);
    const parentCollectionPath = path.substring(0, path.lastIndexOf("(")); // Remove the last key

    let targetContext;
    let currentContext = getCurrentPage(view).getBindingContext();
    while (currentContext && !targetContext) {
      var _currentContext$getBi;
      if (targetPaths.includes(currentContext.getPath())) {
        targetContext = currentContext;
      }
      currentContext = (_currentContext$getBi = currentContext.getBinding()) === null || _currentContext$getBi === void 0 ? void 0 : _currentContext$getBi.getContext();
    }
    if (targetContext) {
      // Found !
      return targetContext;
    }

    // Try to find the target context in a listBinding
    const model = getCurrentPage(view).getBindingContext().getModel();
    const parentListBinding = model.getAllBindings().find(binding => {
      const bindingPath = binding.isRelative() ? binding.getResolvedPath() : binding.getPath();
      return binding.isA("sap.ui.model.odata.v4.ODataListBinding") && bindingPath === parentCollectionPath;
    });
    // We've found a list binding that could contain the target context --> look for it
    targetContext = parentListBinding === null || parentListBinding === void 0 ? void 0 : parentListBinding.getAllCurrentContexts().find(context => {
      return targetPaths.includes(context.getPath());
    });
    return targetContext;
  }
  function navigate(path, view) {
    // TODO: routing.navigate doesn't consider semantic bookmarking
    const currentPage = getCurrentPage(view);
    const targetContext = view.getModel().bindContext(path).getBoundContext();
    currentPage.getController().routing.navigate(targetContext);
  }
  function getCurrentPage(view) {
    const appComponent = CollaborationUtils.getAppComponent(view);
    return CommonUtils.getCurrentPageView(appComponent);
  }

  /**
   * Calculates the metapath from one or more data path(s).
   *
   * @param view The current view
   * @param path One ore more data path(s), in case of multiple paths separated by '|'
   * @returns The calculated metaPath
   */
  function calculateMetaPath(view, path) {
    let metaPath = "";
    if (path) {
      // in case more than one path is sent all of them have to use the same metapath therefore we just consider the first one
      const dataPath = path.split("|")[0];
      metaPath = view.getModel().getMetaModel().getMetaPath(dataPath);
    }
    return metaPath;
  }
  return {
    connect,
    disconnect,
    isConnected,
    isCollaborationEnabled,
    send,
    retainAsyncMessages,
    releaseAsyncMessages,
    updateLocksForContextPath
  };
}, false);
