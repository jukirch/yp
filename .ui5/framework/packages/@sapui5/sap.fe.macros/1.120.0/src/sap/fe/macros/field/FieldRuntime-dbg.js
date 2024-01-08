/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/ActivitySync", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/controls/FieldWrapper", "sap/fe/macros/field/FieldAPI", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageType", "sap/m/Label", "sap/m/library", "sap/m/MessageBox", "sap/m/ResponsivePopover", "sap/ui/core/Core", "sap/ui/core/IconPool", "sap/ui/Device", "sap/ui/model/Filter", "sap/ui/unified/FileUploaderParameter", "sap/ui/util/openWindow"], function (Log, CommonUtils, CollaborationActivitySync, CollaborationCommon, draft, KeepAliveHelper, ModelHelper, ResourceModelHelper, CommonHelper, FieldWrapper, FieldAPI, IllustratedMessage, IllustratedMessageType, Label, mobilelibrary, MessageBox, ResponsivePopover, Core, IconPool, Device, Filter, FileUploaderParameter, openWindow) {
  "use strict";

  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getActivityKeyFromPath = CollaborationCommon.getActivityKeyFromPath;
  var Activity = CollaborationCommon.Activity;
  /**
   * Gets the binding used for collaboration notifications.
   *
   * @param field
   * @returns The binding
   */
  function getCollaborationBinding(field) {
    let binding = field.getBindingContext().getBinding();
    if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
      const oView = CommonUtils.getTargetView(field);
      binding = oView.getBindingContext().getBinding();
    }
    return binding;
  }
  /**
   * Static class used by "sap.ui.mdc.Field" during runtime
   *
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const FieldRuntime = {
    uploadPromises: undefined,
    creatingInactiveRow: false,
    /**
     * Triggers an internal navigation on the link pertaining to DataFieldWithNavigationPath.
     *
     * @param oSource Source of the press event
     * @param oController Instance of the controller
     * @param sNavPath The navigation path
     */
    onDataFieldWithNavigationPath: function (oSource, oController, sNavPath) {
      if (oController._routing) {
        let oBindingContext = oSource.getBindingContext();
        const oView = CommonUtils.getTargetView(oSource),
          oMetaModel = oBindingContext.getModel().getMetaModel(),
          fnNavigate = function (oContext) {
            if (oContext) {
              oBindingContext = oContext;
            }
            oController._routing.navigateToTarget(oBindingContext, sNavPath, true);
          };
        // Show draft loss confirmation dialog in case of Object page
        if (oView.getViewData().converterType === "ObjectPage" && !ModelHelper.isStickySessionSupported(oMetaModel)) {
          draft.processDataLossOrDraftDiscardConfirmation(fnNavigate, Function.prototype, oBindingContext, oView.getController(), true, draft.NavigationType.ForwardNavigation);
        } else {
          fnNavigate();
        }
      } else {
        Log.error("FieldRuntime: No routing listener controller extension found. Internal navigation aborted.", "sap.fe.macros.field.FieldRuntime", "onDataFieldWithNavigationPath");
      }
    },
    isDraftIndicatorVisible: function (sPropertyPath, sSemanticKeyHasDraftIndicator, HasDraftEntity, IsActiveEntity, hideDraftInfo) {
      if (IsActiveEntity !== undefined && HasDraftEntity !== undefined && (!IsActiveEntity || HasDraftEntity) && !hideDraftInfo) {
        return sPropertyPath === sSemanticKeyHasDraftIndicator;
      } else {
        return false;
      }
    },
    /**
     * Handler for the validateFieldGroup event.
     *
     * @function
     * @name onValidateFieldGroup
     * @param oController The controller of the page containing the field
     * @param oEvent The event object passed by the validateFieldGroup event
     */
    onValidateFieldGroup: function (oController, oEvent) {
      const oFEController = FieldRuntime._getExtensionController(oController);
      oFEController._sideEffects.handleFieldGroupChange(oEvent);
    },
    _fetchRecommendations: function (field, controller) {
      const view = CommonUtils.getTargetView(field);
      const fieldBindingContext = field.getBindingContext();
      let recommendationsContext;

      // determine recommendation context to use
      const fieldBinding = fieldBindingContext === null || fieldBindingContext === void 0 ? void 0 : fieldBindingContext.getBinding();
      if (fieldBinding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        // inside a table, use the row
        recommendationsContext = fieldBindingContext;
      } else {
        // inside a form now
        // can have 1-1 navigation property/direct property - use view context
        recommendationsContext = view.getBindingContext();
      }
      const feController = FieldRuntime._getExtensionController(controller);
      feController.recommendations.fetchAndApplyRecommendationsOnFieldChange(field, [recommendationsContext]);
    },
    /**
     * Handler for the change event.
     * Store field group IDs of this field for requesting side effects when required.
     * We store them here to ensure there is a change in the value of the field.
     *
     * @function
     * @name handleChange
     * @param oController The controller of the page containing the field
     * @param oEvent The event object passed by the change event
     */
    handleChange: function (oController, oEvent) {
      const oSourceField = oEvent.getSource(),
        bIsTransient = oSourceField && oSourceField.getBindingContext().isTransient(),
        pValueResolved = oEvent.getParameter("promise") || Promise.resolve(),
        oSource = oEvent.getSource(),
        bValid = oEvent.getParameter("valid"),
        fieldValidity = this.getFieldStateOnChange(oEvent).state["validity"],
        field = oEvent.getSource();

      // Use the FE Controller instead of the extensionAPI to access internal FE controllers
      const oFEController = FieldRuntime._getExtensionController(oController);

      // TODO: currently we have undefined and true... and our creation row implementation relies on this.
      // I would move this logic to this place as it's hard to understand for field consumer
      pValueResolved.then(function () {
        // The event is gone. For now we'll just recreate it again
        oEvent.oSource = oSource;
        oEvent.mParameters = {
          valid: bValid
        };
        FieldAPI.handleChange(oEvent, oController);
        // SIDE EFFECTS
        oFEController._sideEffects.handleFieldChange(oEvent, fieldValidity, pValueResolved);
        // Recommendations
        FieldRuntime._fetchRecommendations(field, oController);
        return;
      }).catch(function /*oError: any*/
      () {
        // The event is gone. For now we'll just recreate it again
        oEvent.oSource = oSource;
        oEvent.mParameters = {
          valid: false
        };
        oFEController._sideEffects.prepareSideEffectsForField(oEvent, fieldValidity, pValueResolved);
        Log.debug("Prerequisites on Field for the SideEffects and Recommendations have been rejected");
        // as the UI might need to react on. We could provide a parameter to inform if validation
        // was successful?
        FieldAPI.handleChange(oEvent, oController);
      });
      oFEController.editFlow.syncTask(pValueResolved);

      // if the context is transient, it means the request would fail anyway as the record does not exist in reality
      // TODO: should the request be made in future if the context is transient?
      if (bIsTransient) {
        return;
      }

      // Collaboration Draft Activity Sync
      const bCollaborationEnabled = CollaborationActivitySync.isConnected(field);
      if (bCollaborationEnabled && fieldValidity) {
        var _ref, _field$getBindingInfo;
        const binding = getCollaborationBinding(field);
        const data = [...(((_ref = field.getBindingInfo("value") || field.getBindingInfo("selected")) === null || _ref === void 0 ? void 0 : _ref.parts) || []), ...(((_field$getBindingInfo = field.getBindingInfo("additionalValue")) === null || _field$getBindingInfo === void 0 ? void 0 : _field$getBindingInfo.parts) || [])].filter(part => {
          return (part === null || part === void 0 ? void 0 : part.path) !== undefined && part.path.indexOf("@@") < 0; // Remove binding parts with @@ that make no sense for collaboration messages
        }).map(function (part) {
          var _field$getBindingCont;
          return `${(_field$getBindingCont = field.getBindingContext()) === null || _field$getBindingCont === void 0 ? void 0 : _field$getBindingCont.getPath()}/${part.path}`;
        });

        // From this point, we will always send a collaboration message (UNLOCK or CHANGE), so we retain
        // a potential UNLOCK that would be sent in handleFocusOut, to make sure it's sent after the CHANGE message
        CollaborationActivitySync.retainAsyncMessages(field, data);
        const updateCollaboration = () => {
          if (binding.hasPendingChanges()) {
            // The value has been changed by the user --> wait until it's sent to the server before sending a notification to other users
            binding.attachEventOnce("patchCompleted", function () {
              CollaborationActivitySync.send(field, {
                action: Activity.Change,
                content: data
              });
              CollaborationActivitySync.releaseAsyncMessages(field, data);
            });
          } else {
            CollaborationActivitySync.releaseAsyncMessages(field, data);
          }
        };
        if (oSourceField.isA("sap.ui.mdc.Field")) {
          pValueResolved.then(() => {
            updateCollaboration();
            return;
          }).catch(() => {
            updateCollaboration();
          });
        } else {
          updateCollaboration();
        }
      }
    },
    /**
     * Handler for the live change event.
     *
     * @function
     * @name handleLiveChange
     * @param event The event object passed by the change event
     */
    handleLiveChange: function (event) {
      FieldAPI.handleLiveChange(event);
    },
    /**
     * Method to send collaboration messages from a FileUploader.
     *
     * @param fileUploader
     * @param action
     */
    _sendCollaborationMessageForFileUploader(fileUploader, action) {
      if (CollaborationActivitySync.isConnected(fileUploader)) {
        var _fileUploader$getPare, _fileUploader$getBind;
        const bindingPath = (_fileUploader$getPare = fileUploader.getParent()) === null || _fileUploader$getPare === void 0 ? void 0 : _fileUploader$getPare.getProperty("propertyPath");
        const fullPath = `${(_fileUploader$getBind = fileUploader.getBindingContext()) === null || _fileUploader$getBind === void 0 ? void 0 : _fileUploader$getBind.getPath()}/${bindingPath}`;
        CollaborationActivitySync.send(fileUploader, {
          action,
          content: fullPath
        });
      }
    },
    /**
     * Handler when a FileUpload dialog is opened.
     *
     * @param event
     */
    handleOpenUploader: function (event) {
      const fileUploader = event.getSource();
      FieldRuntime._sendCollaborationMessageForFileUploader(fileUploader, Activity.Lock);
    },
    /**
     * Handler when a FileUpload dialog is closed.
     *
     * @param event
     */
    handleCloseUploader: function (event) {
      const fileUploader = event.getSource();
      FieldRuntime._sendCollaborationMessageForFileUploader(fileUploader, Activity.Unlock);
    },
    /**
     * Gets the field value and validity on a change event.
     *
     * @function
     * @name fieldValidityOnChange
     * @param oEvent The event object passed by the change event
     * @returns Field value and validity
     */
    getFieldStateOnChange: function (oEvent) {
      let oSourceField = oEvent.getSource(),
        mFieldState = {};
      const _isBindingStateMessages = function (oBinding) {
        return oBinding && oBinding.getDataState() ? oBinding.getDataState().getInvalidValue() === undefined : true;
      };
      if (oSourceField.isA("sap.fe.macros.field.FieldAPI")) {
        oSourceField = oSourceField.getContent();
      }
      if (oSourceField.isA(FieldWrapper.getMetadata().getName()) && oSourceField.getEditMode() === "Editable") {
        oSourceField = oSourceField.getContentEdit()[0];
      }
      if (oSourceField.isA("sap.ui.mdc.Field")) {
        let bIsValid = oEvent.getParameter("valid") || oEvent.getParameter("isValid");
        if (bIsValid === undefined) {
          if (oSourceField.getMaxConditions() === 1) {
            const oValueBindingInfo = oSourceField.getBindingInfo("value");
            bIsValid = _isBindingStateMessages(oValueBindingInfo && oValueBindingInfo.binding);
          }
          if (oSourceField.getValue() === "" && !oSourceField.getProperty("required")) {
            bIsValid = true;
          }
        }
        mFieldState = {
          fieldValue: oSourceField.getValue(),
          validity: !!bIsValid
        };
      } else {
        // oSourceField extends from a FileUploader || Input || is a CheckBox
        const oBinding = oSourceField.getBinding("uploadUrl") || oSourceField.getBinding("value") || oSourceField.getBinding("selected");
        mFieldState = {
          fieldValue: oBinding && oBinding.getValue(),
          validity: _isBindingStateMessages(oBinding)
        };
      }
      return {
        field: oSourceField,
        state: mFieldState
      };
    },
    _fnFixHashQueryString: function (sCurrentHash) {
      if (sCurrentHash && sCurrentHash.indexOf("?") !== -1) {
        // sCurrentHash can contain query string, cut it off!
        sCurrentHash = sCurrentHash.split("?")[0];
      }
      return sCurrentHash;
    },
    _fnGetLinkInformation: function (_oSource, _oLink, _sPropertyPath, _sValue, fnSetActive) {
      const oModel = _oLink && _oLink.getModel();
      const oMetaModel = oModel && oModel.getMetaModel();
      const sSemanticObjectName = _sValue || _oSource && _oSource.getValue();
      const oView = _oLink && CommonUtils.getTargetView(_oLink);
      const oInternalModelContext = oView && oView.getBindingContext("internal");
      const oAppComponent = oView && CommonUtils.getAppComponent(oView);
      const oShellServiceHelper = oAppComponent && oAppComponent.getShellServices();
      const pGetLinksPromise = oShellServiceHelper && oShellServiceHelper.getLinksWithCache([[{
        semanticObject: sSemanticObjectName
      }]]);
      const aSemanticObjectUnavailableActions = oMetaModel && oMetaModel.getObject(`${_sPropertyPath}@com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions`);
      return {
        SemanticObjectName: sSemanticObjectName,
        SemanticObjectFullPath: _sPropertyPath,
        //sSemanticObjectFullPath,
        MetaModel: oMetaModel,
        InternalModelContext: oInternalModelContext,
        ShellServiceHelper: oShellServiceHelper,
        GetLinksPromise: pGetLinksPromise,
        SemanticObjectUnavailableActions: aSemanticObjectUnavailableActions,
        fnSetActive: fnSetActive
      };
    },
    _fnQuickViewHasNewCondition: function (oSemanticObjectPayload, _oLinkInfo) {
      if (oSemanticObjectPayload && oSemanticObjectPayload.path && oSemanticObjectPayload.path === _oLinkInfo.SemanticObjectFullPath) {
        // Got the resolved Semantic Object!
        const bResultingNewConditionForConditionalWrapper = oSemanticObjectPayload[!_oLinkInfo.SemanticObjectUnavailableActions ? "HasTargetsNotFiltered" : "HasTargets"];
        _oLinkInfo.fnSetActive(!!bResultingNewConditionForConditionalWrapper);
        return true;
      } else {
        return false;
      }
    },
    _fnQuickViewSetNewConditionForConditionalWrapper: function (_oLinkInfo, _oFinalSemanticObjects) {
      if (_oFinalSemanticObjects[_oLinkInfo.SemanticObjectName]) {
        let sTmpPath, oSemanticObjectPayload;
        const aSemanticObjectPaths = Object.keys(_oFinalSemanticObjects[_oLinkInfo.SemanticObjectName]);
        for (const iPathsCount in aSemanticObjectPaths) {
          sTmpPath = aSemanticObjectPaths[iPathsCount];
          oSemanticObjectPayload = _oFinalSemanticObjects[_oLinkInfo.SemanticObjectName] && _oFinalSemanticObjects[_oLinkInfo.SemanticObjectName][sTmpPath];
          if (FieldRuntime._fnQuickViewHasNewCondition(oSemanticObjectPayload, _oLinkInfo)) {
            break;
          }
        }
      }
    },
    _fnUpdateSemanticObjectsTargetModel: function (oEvent, sValue, oControl, _sPropertyPath) {
      const oSource = oEvent && oEvent.getSource();
      let fnSetActive;
      if (oControl.isA("sap.m.ObjectStatus")) {
        fnSetActive = bActive => oControl.setActive(bActive);
      }
      if (oControl.isA("sap.m.ObjectIdentifier")) {
        fnSetActive = bActive => oControl.setTitleActive(bActive);
      }
      const oConditionalWrapper = oControl && oControl.getParent();
      if (oConditionalWrapper && oConditionalWrapper.isA("sap.fe.macros.controls.ConditionalWrapper")) {
        fnSetActive = bActive => oConditionalWrapper.setCondition(bActive);
      }
      if (fnSetActive !== undefined) {
        const oLinkInfo = FieldRuntime._fnGetLinkInformation(oSource, oControl, _sPropertyPath, sValue, fnSetActive);
        oLinkInfo.fnSetActive = fnSetActive;
        const sCurrentHash = FieldRuntime._fnFixHashQueryString(CommonUtils.getAppComponent(oControl).getShellServices().getHash());
        CommonUtils.updateSemanticTargets([oLinkInfo.GetLinksPromise], [{
          semanticObject: oLinkInfo.SemanticObjectName,
          path: oLinkInfo.SemanticObjectFullPath
        }], oLinkInfo.InternalModelContext, sCurrentHash).then(function (oFinalSemanticObjects) {
          if (oFinalSemanticObjects) {
            FieldRuntime._fnQuickViewSetNewConditionForConditionalWrapper(oLinkInfo, oFinalSemanticObjects);
          }
          return;
        }).catch(function (oError) {
          Log.error("Cannot update Semantic Targets model", oError);
        });
      }
    },
    _checkControlHasModelAndBindingContext(_control) {
      if (!_control.getModel() || !_control.getBindingContext()) {
        return false;
      } else {
        return true;
      }
    },
    _checkCustomDataValueBeforeUpdatingSemanticObjectModel(_control, propertyPath, aCustomData) {
      let sSemanticObjectPathValue;
      let oValueBinding;
      const _fnCustomDataValueIsString = function (semanticObjectPathValue) {
        return !(semanticObjectPathValue !== null && typeof semanticObjectPathValue === "object");
      };
      // remove technical custom datas set by UI5
      aCustomData = aCustomData.filter(customData => customData.getKey() !== "sap-ui-custom-settings");
      for (const index in aCustomData) {
        sSemanticObjectPathValue = aCustomData[index].getValue();
        if (!sSemanticObjectPathValue && _fnCustomDataValueIsString(sSemanticObjectPathValue)) {
          oValueBinding = aCustomData[index].getBinding("value");
          if (oValueBinding) {
            oValueBinding.attachEventOnce("change", function (_oChangeEvent) {
              FieldRuntime._fnUpdateSemanticObjectsTargetModel(_oChangeEvent, null, _control, propertyPath);
            });
          }
        } else if (_fnCustomDataValueIsString(sSemanticObjectPathValue)) {
          FieldRuntime._fnUpdateSemanticObjectsTargetModel(null, sSemanticObjectPathValue, _control, propertyPath);
        }
      }
    },
    LinkModelContextChange: function (oEvent, sProperty, sPathToProperty) {
      const control = oEvent.getSource();
      if (FieldRuntime._checkControlHasModelAndBindingContext(control)) {
        const sPropertyPath = `${sPathToProperty}/${sProperty}`;
        const mdcLink = control.getDependents().length ? control.getDependents()[0] : undefined;
        const aCustomData = mdcLink === null || mdcLink === void 0 ? void 0 : mdcLink.getCustomData();
        if (aCustomData && aCustomData.length > 0) {
          FieldRuntime._checkCustomDataValueBeforeUpdatingSemanticObjectModel(control, sPropertyPath, aCustomData);
        }
      }
    },
    openExternalLink: function (event) {
      const source = event.getSource();
      if (source.data("url") && source.getProperty("text") !== "") {
        // This opens the link in the same tab as the link. It was done to be more consistent with other type of links.
        openWindow(source.data("url"), "_self");
      }
    },
    createPopoverWithNoTargets: function (mdcLink) {
      const mdcLinkId = mdcLink.getId();
      const illustratedMessageSettings = {
        title: getResourceModel(mdcLink).getText("M_ILLUSTRATEDMESSAGE_TITLE"),
        description: getResourceModel(mdcLink).getText("M_ILLUSTRATEDMESSAGE_DESCRIPTION"),
        enableFormattedText: true,
        illustrationSize: "Dot",
        // IllustratedMessageSize.Dot not available in "@types/openui5": "1.107.0"
        illustrationType: IllustratedMessageType.Tent
      };
      const illustratedMessage = new IllustratedMessage(`${mdcLinkId}-illustratedmessage`, illustratedMessageSettings);
      const popoverSettings = {
        horizontalScrolling: false,
        showHeader: Device.system.phone,
        placement: mobilelibrary.PlacementType.Auto,
        content: [illustratedMessage],
        afterClose: function (event) {
          if (event.getSource()) {
            event.getSource().destroy();
          }
        }
      };
      return new ResponsivePopover(`${mdcLinkId}-popover`, popoverSettings);
    },
    openLink: async function (mdcLink, sapmLink) {
      try {
        const hRef = await mdcLink.getTriggerHref();
        if (!hRef) {
          try {
            const linkItems = await mdcLink.retrieveLinkItems();
            if ((linkItems === null || linkItems === void 0 ? void 0 : linkItems.length) === 0 && mdcLink.getPayload().hasQuickViewFacets === "false") {
              const popover = FieldRuntime.createPopoverWithNoTargets(mdcLink);
              mdcLink.addDependent(popover);
              popover.openBy(sapmLink);
            } else {
              await mdcLink.open(sapmLink);
            }
          } catch (error) {
            Log.error(`Cannot retrieve the QuickView Popover dialog: ${error}`);
          }
        } else {
          const view = CommonUtils.getTargetView(sapmLink);
          const appComponent = CommonUtils.getAppComponent(view);
          const shellService = appComponent.getShellServices();
          const shellHash = shellService.parseShellHash(hRef);
          const navArgs = {
            target: {
              semanticObject: shellHash.semanticObject,
              action: shellHash.action
            },
            params: shellHash.params
          };
          KeepAliveHelper.storeControlRefreshStrategyForHash(view, shellHash);
          if (CommonUtils.isStickyEditMode(sapmLink) !== true) {
            //URL params and xappState has been generated earlier hence using toExternal
            shellService.toExternal(navArgs, appComponent);
          } else {
            try {
              const newHref = await shellService.hrefForExternalAsync(navArgs, appComponent);
              openWindow(newHref);
            } catch (error) {
              Log.error(`Error while retireving hrefForExternal : ${error}`);
            }
          }
        }
      } catch (error) {
        Log.error(`Error triggering link Href: ${error}`);
      }
    },
    pressLink: async function (oEvent) {
      const oSource = oEvent.getSource();
      const sapmLink = oSource.isA("sap.m.ObjectIdentifier") ? oSource.findElements(false, elem => {
        return elem.isA("sap.m.Link");
      })[0] : oSource;
      if (oSource.getDependents() && oSource.getDependents().length > 0 && sapmLink.getProperty("text") !== "") {
        const oFieldInfo = oSource.getDependents()[0];
        if (oFieldInfo && oFieldInfo.isA("sap.ui.mdc.Link")) {
          await FieldRuntime.openLink(oFieldInfo, sapmLink);
        }
      }
      return sapmLink;
    },
    uploadStream: function (controller, event) {
      const fileUploader = event.getSource(),
        FEController = FieldRuntime._getExtensionController(controller),
        fileWrapper = fileUploader.getParent(),
        uploadUrl = fileWrapper.getUploadUrl();
      if (uploadUrl !== "") {
        var _fileUploader$getMode, _fileUploader$getBind2;
        fileWrapper.setUIBusy(true);

        // use uploadUrl from FileWrapper which returns a canonical URL
        fileUploader.setUploadUrl(uploadUrl);
        fileUploader.removeAllHeaderParameters();
        const token = (_fileUploader$getMode = fileUploader.getModel()) === null || _fileUploader$getMode === void 0 ? void 0 : _fileUploader$getMode.getHttpHeaders()["X-CSRF-Token"];
        if (token) {
          const headerParameterCSRFToken = new FileUploaderParameter();
          headerParameterCSRFToken.setName("x-csrf-token");
          headerParameterCSRFToken.setValue(token);
          fileUploader.addHeaderParameter(headerParameterCSRFToken);
        }
        const eTag = (_fileUploader$getBind2 = fileUploader.getBindingContext()) === null || _fileUploader$getBind2 === void 0 ? void 0 : _fileUploader$getBind2.getProperty("@odata.etag");
        if (eTag) {
          const headerParameterETag = new FileUploaderParameter();
          headerParameterETag.setName("If-Match");
          // Ignore ETag in collaboration draft
          headerParameterETag.setValue(CollaborationActivitySync.isConnected(fileUploader) ? "*" : eTag);
          fileUploader.addHeaderParameter(headerParameterETag);
        }
        const headerParameterAccept = new FileUploaderParameter();
        headerParameterAccept.setName("Accept");
        headerParameterAccept.setValue("application/json");
        fileUploader.addHeaderParameter(headerParameterAccept);

        // synchronize upload with other requests
        const uploadPromise = new Promise((resolve, reject) => {
          this.uploadPromises = this.uploadPromises || {};
          this.uploadPromises[fileUploader.getId()] = {
            resolve: resolve,
            reject: reject
          };
          fileUploader.upload();
        });
        FEController.editFlow.syncTask(uploadPromise);
      } else {
        MessageBox.error(getResourceModel(controller).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT"));
      }
    },
    handleUploadComplete: function (event, propertyFileName, propertyPath, controller) {
      const status = Number(event.getParameter("status")),
        fileUploader = event.getSource(),
        fileWrapper = fileUploader.getParent();
      fileWrapper.setUIBusy(false);
      const context = fileUploader.getBindingContext();
      if (status === 0 || status >= 400) {
        this._displayMessageForFailedUpload(event);
        this.uploadPromises[fileUploader.getId()].reject();
      } else {
        var _event$getParameter, _fileWrapper$avatar;
        const newETag = (_event$getParameter = event.getParameter("headers")) === null || _event$getParameter === void 0 ? void 0 : _event$getParameter.etag;
        if (newETag) {
          // set new etag for filename update, but without sending patch request
          context === null || context === void 0 ? void 0 : context.setProperty("@odata.etag", newETag, null);
        }

        // set filename for link text
        if (propertyFileName !== null && propertyFileName !== void 0 && propertyFileName.path) {
          context === null || context === void 0 ? void 0 : context.setProperty(propertyFileName.path, fileUploader.getValue());
        }

        // delete the avatar cache that not gets updated otherwise
        (_fileWrapper$avatar = fileWrapper.avatar) === null || _fileWrapper$avatar === void 0 ? void 0 : _fileWrapper$avatar.refreshAvatarCacheBusting();
        this._callSideEffectsForStream(event, fileWrapper, controller);
        this.uploadPromises[fileUploader.getId()].resolve();
      }
      delete this.uploadPromises[fileUploader.getId()];

      // Collaboration Draft Activity Sync
      const isCollaborationEnabled = CollaborationActivitySync.isConnected(fileUploader);
      if (!isCollaborationEnabled || !context) {
        return;
      }
      const notificationData = [`${context.getPath()}/${propertyPath}`];
      if (propertyFileName !== null && propertyFileName !== void 0 && propertyFileName.path) {
        notificationData.push(`${context.getPath()}/${propertyFileName.path}`);
      }
      let binding = context.getBinding();
      if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        const oView = CommonUtils.getTargetView(fileUploader);
        binding = oView.getBindingContext().getBinding();
      }
      if (binding.hasPendingChanges()) {
        binding.attachEventOnce("patchCompleted", () => {
          CollaborationActivitySync.send(fileWrapper, {
            action: Activity.Change,
            content: notificationData
          });
          CollaborationActivitySync.send(fileWrapper, {
            action: Activity.Unlock,
            content: notificationData
          });
        });
      } else {
        CollaborationActivitySync.send(fileWrapper, {
          action: Activity.Change,
          content: notificationData
        });
        CollaborationActivitySync.send(fileWrapper, {
          action: Activity.Unlock,
          content: notificationData
        });
      }
    },
    _displayMessageForFailedUpload: function (oEvent) {
      // handling of backend errors
      const sError = oEvent.getParameter("responseRaw") || oEvent.getParameter("response");
      let sMessageText, oError;
      try {
        oError = sError && JSON.parse(sError);
        sMessageText = oError.error && oError.error.message;
      } catch (e) {
        sMessageText = sError || getResourceModel(oEvent.getSource()).getText("M_FIELD_FILEUPLOADER_ABORTED_TEXT");
      }
      MessageBox.error(sMessageText);
    },
    removeStream: function (event, propertyFileName, propertyPath, controller) {
      const deleteButton = event.getSource();
      const fileWrapper = deleteButton.getParent();
      const context = fileWrapper.getBindingContext();

      // streams are removed by assigning the null value
      context.setProperty(propertyPath, null);
      // When setting the property to null, the uploadUrl (@@MODEL.format) is set to "" by the model
      //	with that another upload is not possible before refreshing the page
      // (refreshing the page would recreate the URL)
      //	This is the workaround:
      //	We set the property to undefined only on the frontend which will recreate the uploadUrl
      context.setProperty(propertyPath, undefined, null);
      this._callSideEffectsForStream(event, fileWrapper, controller);

      // Collaboration Draft Activity Sync
      const bCollaborationEnabled = CollaborationActivitySync.isConnected(deleteButton);
      if (bCollaborationEnabled) {
        let binding = context.getBinding();
        if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          const oView = CommonUtils.getTargetView(deleteButton);
          binding = oView.getBindingContext().getBinding();
        }
        const data = [`${context.getPath()}/${propertyPath}`];
        if (propertyFileName !== null && propertyFileName !== void 0 && propertyFileName.path) {
          data.push(`${context.getPath()}/${propertyFileName.path}`);
        }
        CollaborationActivitySync.send(deleteButton, {
          action: Activity.Lock,
          content: data
        });
        binding.attachEventOnce("patchCompleted", function () {
          CollaborationActivitySync.send(deleteButton, {
            action: Activity.Change,
            content: data
          });
          CollaborationActivitySync.send(deleteButton, {
            action: Activity.Unlock,
            content: data
          });
        });
      }
    },
    _callSideEffectsForStream: function (oEvent, oControl, oController) {
      const oFEController = FieldRuntime._getExtensionController(oController);
      if (oControl && oControl.getBindingContext().isTransient()) {
        return;
      }
      if (oControl) {
        oEvent.oSource = oControl;
      }
      oFEController._sideEffects.handleFieldChange(oEvent, this.getFieldStateOnChange(oEvent).state["validity"]);
    },
    getIconForMimeType: function (sMimeType) {
      return IconPool.getIconForMimeType(sMimeType);
    },
    /**
     * Method to retrieve text from value list for DataField.
     *
     * @function
     * @name retrieveTextFromValueList
     * @param sPropertyValue The property value of the datafield
     * @param sPropertyFullPath The property full path's
     * @param sDisplayFormat The display format for the datafield
     * @returns The formatted value in corresponding display format.
     */
    retrieveTextFromValueList: function (sPropertyValue, sPropertyFullPath, sDisplayFormat) {
      let sTextProperty;
      let oMetaModel;
      let sPropertyName;
      if (sPropertyValue) {
        oMetaModel = CommonHelper.getMetaModel();
        sPropertyName = oMetaModel.getObject(`${sPropertyFullPath}@sapui.name`);
        return oMetaModel.requestValueListInfo(sPropertyFullPath, true).then(function (mValueListInfo) {
          // take the "" one if exists, otherwise take the first one in the object TODO: to be discussed
          const oValueListInfo = mValueListInfo[mValueListInfo[""] ? "" : Object.keys(mValueListInfo)[0]];
          const oValueListModel = oValueListInfo.$model;
          const oMetaModelValueList = oValueListModel.getMetaModel();
          const oParamWithKey = oValueListInfo.Parameters.find(function (oParameter) {
            return oParameter.LocalDataProperty && oParameter.LocalDataProperty.$PropertyPath === sPropertyName;
          });
          if (oParamWithKey && !oParamWithKey.ValueListProperty) {
            throw new Error(`Inconsistent value help annotation for ${sPropertyName}`);
          }
          const oTextAnnotation = oMetaModelValueList.getObject(`/${oValueListInfo.CollectionPath}/${oParamWithKey.ValueListProperty}@com.sap.vocabularies.Common.v1.Text`);
          if (oTextAnnotation && oTextAnnotation.$Path) {
            sTextProperty = oTextAnnotation.$Path;
            const oFilter = new Filter({
              path: oParamWithKey.ValueListProperty,
              operator: "EQ",
              value1: sPropertyValue
            });
            const oListBinding = oValueListModel.bindList(`/${oValueListInfo.CollectionPath}`, undefined, undefined, oFilter, {
              $select: sTextProperty
            });
            return oListBinding.requestContexts(0, 2);
          } else {
            sDisplayFormat = "Value";
            return sPropertyValue;
          }
        }).then(function (aContexts) {
          var _aContexts$;
          const sDescription = sTextProperty ? (_aContexts$ = aContexts[0]) === null || _aContexts$ === void 0 ? void 0 : _aContexts$.getObject()[sTextProperty] : "";
          switch (sDisplayFormat) {
            case "Description":
              return sDescription;
            case "DescriptionValue":
              return Core.getLibraryResourceBundle("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [sDescription, sPropertyValue]);
            case "ValueDescription":
              return Core.getLibraryResourceBundle("sap.fe.core").getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [sPropertyValue, sDescription]);
            default:
              return sPropertyValue;
          }
        }).catch(function (oError) {
          const sMsg = oError.status && oError.status === 404 ? `Metadata not found (${oError.status}) for value help of property ${sPropertyFullPath}` : oError.message;
          Log.error(sMsg);
        });
      }
      return sPropertyValue;
    },
    handleTypeMissmatch: function (oEvent) {
      const resourceModel = getResourceModel(oEvent.getSource());
      MessageBox.error(resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE"), {
        details: `<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_SELECTED")}</strong></p>${oEvent.getParameters().mimeType}<br><br>` + `<p><strong>${resourceModel.getText("M_FIELD_FILEUPLOADER_WRONG_MIMETYPE_DETAILS_ALLOWED")}</strong></p>${oEvent.getSource().getMimeType().toString().replaceAll(",", ", ")}`,
        contentWidth: "150px"
      });
    },
    handleFileSizeExceed: function (oEvent) {
      MessageBox.error(getResourceModel(oEvent.getSource()).getText("M_FIELD_FILEUPLOADER_FILE_TOO_BIG", oEvent.getSource().getMaximumFileSize().toFixed(3)), {
        contentWidth: "150px"
      });
    },
    _getExtensionController: function (oController) {
      return oController.isA("sap.fe.core.ExtensionAPI") ? oController._controller : oController;
    },
    /**
     * Event handler to create and show who is editing the field popover.
     *
     * @param source The avatar which is next to the field locked
     * @param view Current view
     */
    showCollaborationEditUser: function (source, view) {
      var _source$getBinding, _source$getBindingCon, _editingActivity;
      const resourceModel = ResourceModelHelper.getResourceModel(view);
      let popover = Core.byId(`manageCollaborationDraft--editUser`);
      if (!popover) {
        popover = new ResponsivePopover("manageCollaborationDraft--editUser", {
          showHeader: false,
          placement: "Bottom"
        });
        popover.addStyleClass("sapUiContentPadding");
        view.addDependent(popover);
      }
      const bindingPath = (_source$getBinding = source.getBinding("initials")) === null || _source$getBinding === void 0 ? void 0 : _source$getBinding.getBindings().find(binding => {
        var _binding$getPath;
        return binding === null || binding === void 0 ? void 0 : (_binding$getPath = binding.getPath()) === null || _binding$getPath === void 0 ? void 0 : _binding$getPath.startsWith("/collaboration/activities");
      }).getPath();
      const activities = (_source$getBindingCon = source.getBindingContext("internal")) === null || _source$getBindingCon === void 0 ? void 0 : _source$getBindingCon.getObject(bindingPath);
      let editingActivity;
      if (activities && activities.length > 0) {
        editingActivity = activities.find(activity => {
          return activity.key === getActivityKeyFromPath(source.getBindingContext().getPath());
        });
      }
      popover.destroyContent();
      popover.addContent(new Label({
        text: resourceModel.getText("C_COLLABORATIONAVATAR_USER_EDIT_FIELD", [`${(_editingActivity = editingActivity) === null || _editingActivity === void 0 ? void 0 : _editingActivity.name}`])
      }));
      popover.openBy(source);
    }
  };

  /**
   * @global
   */
  return FieldRuntime;
}, true);
