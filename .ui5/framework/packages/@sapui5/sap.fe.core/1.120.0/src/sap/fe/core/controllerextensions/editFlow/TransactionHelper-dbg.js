/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/controllerextensions/editFlow/operations", "sap/fe/core/controllerextensions/editFlow/sticky", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/library", "sap/m/Button", "sap/m/Dialog", "sap/m/MessageBox", "sap/m/MessageToast", "sap/m/Popover", "sap/m/Text", "sap/m/VBox", "sap/ui/core/Core", "sap/ui/core/Fragment", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/library", "sap/ui/core/util/XMLPreprocessor", "sap/ui/model/json/JSONModel", "../../converters/annotations/DataField", "../../helpers/MetaModelFunction", "../../helpers/ToES6Promise", "../../helpers/TypeGuards"], function (Log, ActionRuntime, CommonUtils, BusyLocker, draft, operations, sticky, messageHandling, MetaModelConverter, deleteHelper, FPMHelper, ModelHelper, ResourceModelHelper, StableIdHelper, FELibrary, Button, Dialog, MessageBox, MessageToast, Popover, Text, VBox, Core, Fragment, XMLTemplateProcessor, coreLibrary, XMLPreprocessor, JSONModel, DataField, MetaModelFunction, toES6Promise, TypeGuards) {
  "use strict";

  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var getRequiredPropertiesFromInsertRestrictions = MetaModelFunction.getRequiredPropertiesFromInsertRestrictions;
  var getNonComputedVisibleFields = MetaModelFunction.getNonComputedVisibleFields;
  var isDataFieldForAction = DataField.isDataFieldForAction;
  var generate = StableIdHelper.generate;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const CreationMode = FELibrary.CreationMode;
  const ProgrammingModel = FELibrary.ProgrammingModel;

  //Enums for delete text calculations for delete confirm dialog.
  const DeleteOptionTypes = deleteHelper.DeleteOptionTypes;
  const DeleteDialogContentControl = deleteHelper.DeleteDialogContentControl;

  /* Make sure that the mParameters is not the oEvent */
  function getParameters(mParameters) {
    if (mParameters && mParameters.getMetadata && mParameters.getMetadata().getName() === "sap.ui.base.Event") {
      mParameters = {};
    }
    return mParameters || {};
  }
  let TransactionHelper = /*#__PURE__*/function () {
    function TransactionHelper() {}
    var _proto = TransactionHelper.prototype;
    _proto.busyLock = function busyLock(appComponent, busyPath) {
      BusyLocker.lock(appComponent.getModel("ui"), busyPath);
    };
    _proto.busyUnlock = function busyUnlock(appComponent, busyPath) {
      BusyLocker.unlock(appComponent.getModel("ui"), busyPath);
    };
    _proto.getProgrammingModel = function getProgrammingModel(source) {
      let path;
      if (source.isA("sap.ui.model.odata.v4.Context")) {
        path = source.getPath();
      } else {
        path = (source.isRelative() ? source.getResolvedPath() : source.getPath()) ?? "";
      }
      const metaModel = source.getModel().getMetaModel();
      if (ModelHelper.isDraftSupported(metaModel, path)) {
        return ProgrammingModel.Draft;
      } else if (ModelHelper.isStickySessionSupported(metaModel)) {
        return ProgrammingModel.Sticky;
      } else {
        return ProgrammingModel.NonDraft;
      }
    }

    /**
     * Validates a document.
     *
     * @param oContext Context of the document to be validated
     * @param [mParameters] Can contain the following attributes:
     * @param [mParameters.data] A map of data that should be validated
     * @param [mParameters.customValidationFunction] A string representing the path to the validation function
     * @param oView Contains the object of the current view
     * @returns Promise resolves with result of the custom validation function
     * @final
     */;
    _proto.validateDocument = function validateDocument(oContext, mParameters, oView) {
      const sCustomValidationFunction = mParameters && mParameters.customValidationFunction;
      if (sCustomValidationFunction) {
        const sModule = sCustomValidationFunction.substring(0, sCustomValidationFunction.lastIndexOf(".") || -1).replace(/\./gi, "/"),
          sFunctionName = sCustomValidationFunction.substring(sCustomValidationFunction.lastIndexOf(".") + 1, sCustomValidationFunction.length),
          mData = mParameters.data;
        delete mData["@$ui5.context.isTransient"];
        return FPMHelper.validationWrapper(sModule, sFunctionName, mData, oView, oContext);
      }
      return Promise.resolve([]);
    }

    /**
     * Retrieves defatul values from the DefaultValue function.
     *
     * @param listBinding The list binding to be used for creation
     * @returns A promise with an object containing the default values (or undefined if there's no default value function)
     */;
    _proto.getDataFromDefaultValueFunction = async function getDataFromDefaultValueFunction(listBinding) {
      var _annotations$Common, _listBindingObjectPat, _listBindingObjectPat2, _defaultFunctionObjec;
      const model = listBinding.getModel();
      const metaModel = model.getMetaModel();
      const metaContext = metaModel.getMetaContext(listBinding.getResolvedPath());
      const listBindingObjectPath = getInvolvedDataModelObjects(metaContext);
      const defaultFuncOnTargetObject = (_annotations$Common = listBindingObjectPath.targetObject.annotations.Common) === null || _annotations$Common === void 0 ? void 0 : _annotations$Common.DefaultValuesFunction;
      const defaultFuncOnTargetEntitySet = (_listBindingObjectPat = listBindingObjectPath.targetEntitySet) === null || _listBindingObjectPat === void 0 ? void 0 : (_listBindingObjectPat2 = _listBindingObjectPat.annotations.Common) === null || _listBindingObjectPat2 === void 0 ? void 0 : _listBindingObjectPat2.DefaultValuesFunction;
      const defaultFunctionName = defaultFuncOnTargetObject ?? defaultFuncOnTargetEntitySet;
      if (!defaultFunctionName) {
        // No default value function
        return undefined;
      }
      const functionOnNavProp = isNavigationProperty(listBindingObjectPath.targetObject) && defaultFuncOnTargetObject !== undefined;
      const defaultFunctionContext = functionOnNavProp ? listBinding.getContext() : listBinding.getHeaderContext();
      if (!defaultFunctionContext) {
        return undefined;
      }
      const defaultFunctionPath = `${metaModel.getMetaPath(defaultFunctionContext.getPath())}/${defaultFunctionName}`;
      const defaultFunctionObjectPath = getInvolvedDataModelObjects(metaModel.getMetaContext(defaultFunctionPath));
      const defaultFunctionResult = (_defaultFunctionObjec = defaultFunctionObjectPath.targetObject) !== null && _defaultFunctionObjec !== void 0 && _defaultFunctionObjec.isBound ? await operations.callBoundFunction(defaultFunctionName.toString(), defaultFunctionContext, model) : await operations.callFunctionImport(defaultFunctionName.toString(), model);
      return defaultFunctionResult.getObject();
    }

    /**
     * Checks if a list binding corresponds to a hierarchy.
     *
     * @param listBinding
     * @returns True if the list binding is hierarchical.
     */;
    _proto.isListBindingHierarchical = function isListBindingHierarchical(listBinding) {
      var _listBinding$getAggre;
      return (_listBinding$getAggre = listBinding.getAggregation()) !== null && _listBinding$getAggre !== void 0 && _listBinding$getAggre.hierarchyQualifier ? true : false;
    }

    /**
     * Creates a new context in a list binding. Handles both flat and hierarchical cases.
     *
     * @param listBinding
     * @param initialData Initial data to create the context.
     * @param options Creation options.
     * @param options.createAtEnd Create the context at the end of the list (ignored in case of a hierarchy).
     * @param options.createInactive Create the context as inactive (ignored in case of a hierarchy).
     * @param options.parentContext Create the context as a	 child of this context (ony used in case of a hierarchy).
     * @returns The created context.
     */;
    _proto.createContext = async function createContext(listBinding, initialData, options) {
      const dataForCreation = initialData ?? {};
      if (this.isListBindingHierarchical(listBinding)) {
        var _options$parentContex;
        if (((_options$parentContex = options.parentContext) === null || _options$parentContex === void 0 ? void 0 : _options$parentContex.isExpanded()) === false) {
          // If the parent context already has children and is collapsed, we expand it first
          await listBinding.expand(options.parentContext);
        }
        Object.assign(dataForCreation, {
          "@$ui5.node.parent": options.parentContext
        });
        return listBinding.create(dataForCreation, true);
      } else {
        return listBinding.create(dataForCreation, true, options.createAtEnd, options.createInactive);
      }
    };
    _proto.getCreationParameters = function getCreationParameters(listBinding, createData, appComponent) {
      const metaModel = listBinding.getModel().getMetaModel();
      const metaPath = metaModel.getMetaPath(listBinding.getHeaderContext().getPath());
      const nonComputedVisibleFields = getNonComputedVisibleFields(metaModel, metaPath, appComponent);
      // Do not consider fields for which we provide some initial data
      return nonComputedVisibleFields.filter(fieldName => {
        return !(fieldName in (createData ?? {}));
      });
    }

    /**
     * Creates a new document.
     *
     * @param oMainListBinding OData V4 ListBinding object
     * @param [mInParameters] Optional, can contain the following attributes:
     * @param [mInParameters.data] A map of data that should be sent within the POST
     * @param [mInParameters.busyMode] Global (default), Local, None TODO: to be refactored
     * @param [mInParameters.busyId] ID of the local busy indicator
     * @param [mInParameters.keepTransientContextOnFailed] If set, the context stays in the list if the POST failed and POST will be repeated with the next change
     * @param [mInParameters.inactive] If set, the context is set as inactive for empty rows
     * @param [mInParameters.skipParameterDialog] Skips the action parameter dialog
     * @param appComponent The app component
     * @param messageHandler The message handler extension
     * @param fromCopyPaste True if the creation has been triggered by a paste action
     * @returns Promise resolves with new binding context
     * @final
     */;
    _proto.createDocument = async function createDocument(oMainListBinding, mInParameters, appComponent, messageHandler, fromCopyPaste) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const oModel = oMainListBinding.getModel(),
        oMetaModel = oModel.getMetaModel(),
        sMetaPath = oMetaModel.getMetaPath(oMainListBinding.getHeaderContext().getPath()),
        sCreateHash = appComponent.getRouterProxy().getHash(),
        oComponentData = appComponent.getComponentData(),
        oStartupParameters = oComponentData && oComponentData.startupParameters || {},
        sNewAction = !oMainListBinding.isRelative() ? this._getNewAction(oStartupParameters, sCreateHash, oMetaModel, sMetaPath) : undefined;
      const mBindingParameters = {
        $$patchWithoutSideEffects: true
      };
      const sMessagesPath = oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.Common.v1.Messages/$Path`);
      let sBusyPath = "/busy";
      let oNewDocumentContext;
      if (sMessagesPath) {
        mBindingParameters["$select"] = sMessagesPath;
      }
      const mParameters = getParameters(mInParameters);
      if (!oMainListBinding) {
        throw new Error("Binding required for new document creation");
      }
      const sProgrammingModel = this.getProgrammingModel(oMainListBinding);
      if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
        throw new Error("Create document only allowed for draft or sticky session supported services");
      }
      if (mParameters.busyMode === "Local") {
        sBusyPath = `/busyLocal/${mParameters.busyId}`;
      }
      mParameters.beforeCreateCallBack = fromCopyPaste ? null : mParameters.beforeCreateCallBack;
      if (!(mInParameters !== null && mInParameters !== void 0 && mInParameters.inactive)) {
        this.busyLock(appComponent, sBusyPath);
      }
      const oResourceBundleCore = Core.getLibraryResourceBundle("sap.fe.core");
      let oResult;
      try {
        if (sNewAction) {
          oResult = await this.callAction(sNewAction, {
            contexts: oMainListBinding.getHeaderContext(),
            showActionParameterDialog: true,
            label: this._getSpecificCreateActionDialogLabel(oMetaModel, sMetaPath, sNewAction, oResourceBundleCore),
            bindingParameters: mBindingParameters,
            parentControl: mParameters.parentControl,
            bIsCreateAction: true,
            skipParameterDialog: mParameters.skipParameterDialog
          }, null, appComponent, messageHandler);
        } else {
          try {
            const initialData = mParameters.data;
            if (!fromCopyPaste) {
              const defaultValueFunctionData = await this.getDataFromDefaultValueFunction(oMainListBinding);
              mParameters.data = Object.assign({}, defaultValueFunctionData, mParameters.data);
            }
            if (mParameters.data) {
              delete mParameters.data["@odata.context"];
            }
            const bIsNewPageCreation = mParameters.creationMode !== CreationMode.CreationRow && mParameters.creationMode !== CreationMode.Inline;
            const aNonComputedVisibleKeyFields = bIsNewPageCreation ? this.getCreationParameters(oMainListBinding, initialData, appComponent) : [];
            if (aNonComputedVisibleKeyFields.length > 0) {
              oResult = await this._launchDialogWithKeyFields(oMainListBinding, aNonComputedVisibleKeyFields, oModel, mParameters, appComponent, messageHandler);
              oNewDocumentContext = oResult.newContext;
            } else {
              if (mParameters.beforeCreateCallBack) {
                await toES6Promise(mParameters.beforeCreateCallBack({
                  contextPath: oMainListBinding && oMainListBinding.getPath()
                }));
              }
              oNewDocumentContext = await this.createContext(oMainListBinding, mParameters.data, {
                createAtEnd: !!mParameters.createAtEnd,
                createInactive: !!mParameters.inactive,
                parentContext: mParameters.parentContext
              });
              if (!mParameters.inactive) {
                oResult = await this.onAfterCreateCompletion(oMainListBinding, oNewDocumentContext, mParameters);
              }
            }
          } catch (oError) {
            Log.error("Error while creating the new document", oError);
            throw oError;
          }
        }
        oNewDocumentContext = oNewDocumentContext || oResult;
        await messageHandler.showMessageDialog({
          control: mParameters.parentControl
        });
        return oNewDocumentContext;
      } catch (error) {
        var _oNewDocumentContext;
        // TODO: currently, the only errors handled here are raised as string - should be changed to Error objects
        await messageHandler.showMessageDialog({
          control: mParameters.parentControl
        });
        if ((error === FELibrary.Constants.ActionExecutionFailed || error === FELibrary.Constants.CancelActionDialog) && (_oNewDocumentContext = oNewDocumentContext) !== null && _oNewDocumentContext !== void 0 && _oNewDocumentContext.isTransient()) {
          // This is a workaround suggested by model as Context.delete results in an error
          // TODO: remove the $direct once model resolves this issue
          // this line shows the expected console error Uncaught (in promise) Error: Request canceled: POST Travel; group: submitLater
          oNewDocumentContext.delete("$direct");
        }
        throw error;
      } finally {
        if (!(mInParameters !== null && mInParameters !== void 0 && mInParameters.inactive)) {
          this.busyUnlock(appComponent, sBusyPath);
        }
      }
    };
    _proto._isDraftEnabled = function _isDraftEnabled(vContexts) {
      const contextForDraftModel = vContexts[0];
      const sProgrammingModel = this.getProgrammingModel(contextForDraftModel);
      return sProgrammingModel === ProgrammingModel.Draft;
    }

    /**
     * Delete one or multiple document(s).
     *
     * @param contexts Contexts Either one context or an array with contexts to be deleted
     * @param mParameters Optional, can contain the following attributes:
     * @param mParameters.title Title of the object to be deleted
     * @param mParameters.description Description of the object to be deleted
     * @param mParameters.numberOfSelectedContexts Number of objects selected
     * @param mParameters.noDialog To disable the confirmation dialog
     * @param appComponent The appComponent
     * @param resourceModel The resource model to load text resources
     * @param messageHandler The message handler extension
     * @returns A Promise resolved once the documents are deleted
     */;
    _proto.deleteDocument = function deleteDocument(contexts, mParameters, appComponent, resourceModel, messageHandler) {
      // delete document lock
      this.busyLock(appComponent);
      const contextsToDelete = Array.isArray(contexts) ? [...contexts] : [contexts];
      return new Promise((resolve, reject) => {
        try {
          const draftEnabled = this._isDraftEnabled(mParameters.selectedContexts || contextsToDelete);
          const items = [];
          let options = [];
          let unSavedContext;

          // items(texts) and options(checkBoxes and single default option) for confirm dialog.
          if (mParameters) {
            if (!mParameters.numberOfSelectedContexts) {
              // non-Table
              if (draftEnabled) {
                // Check if 1 of the drafts is locked by another user
                const lockedContext = contextsToDelete.find(context => {
                  const contextData = context.getObject();
                  return contextData.IsActiveEntity === true && contextData.HasDraftEntity === true && contextData.DraftAdministrativeData && contextData.DraftAdministrativeData.InProcessByUser && !contextData.DraftAdministrativeData.DraftIsCreatedByMe;
                });
                if (lockedContext) {
                  // Show message box with the name of the locking user and return
                  const lockingUserName = lockedContext.getObject().DraftAdministrativeData.InProcessByUser;
                  MessageBox.show(resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_SINGLE_OBJECT_LOCKED", [lockingUserName]), {
                    title: resourceModel.getText("C_COMMON_DELETE"),
                    onClose: reject
                  });
                  return;
                } else {
                  unSavedContext = contextsToDelete.find(context => {
                    const {
                      IsActiveEntity,
                      HasDraftEntity,
                      DraftAdministrativeData
                    } = context.getObject() || {};
                    return IsActiveEntity === true && HasDraftEntity === true && !!(DraftAdministrativeData !== null && DraftAdministrativeData !== void 0 && DraftAdministrativeData.InProcessByUser);
                  });
                }
              }
              mParameters = getParameters(mParameters);
              let nonTableTxt = "";
              if (unSavedContext) {
                const unSavedContextUser = unSavedContext.getObject().DraftAdministrativeData.InProcessByUser;
                nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_UNSAVED_CHANGES", [unSavedContextUser], mParameters.entitySetName);
              } else if (mParameters.title) {
                if (mParameters.description) {
                  nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTINFO", [mParameters.title, mParameters.description], mParameters.entitySetName);
                } else {
                  nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_ONLY", [mParameters.title], mParameters.entitySetName);
                }
              } else {
                nonTableTxt = resourceModel.getText("C_TRANSACTION_HELPER_CONFIRM_DELETE_WITH_OBJECTTITLE_SINGULAR", undefined, mParameters.entitySetName);
              }
              options.push({
                type: DeleteOptionTypes.deletableContexts,
                contexts: contextsToDelete,
                text: nonTableTxt,
                selected: true,
                control: DeleteDialogContentControl.TEXT
              });
            } else {
              // Table
              let totalDeletable = contextsToDelete.length;
              if (draftEnabled) {
                totalDeletable += mParameters.draftsWithNonDeletableActive.length + mParameters.draftsWithDeletableActive.length + mParameters.unSavedContexts.length;
                deleteHelper.updateDraftOptionsForDeletableTexts(mParameters, contextsToDelete, totalDeletable, resourceModel, items, options);
              } else {
                const nonDeletableText = deleteHelper.getNonDeletableText(mParameters, totalDeletable, resourceModel);
                if (nonDeletableText) {
                  items.push(nonDeletableText);
                }
              }
              const optionsDeletableTexts = deleteHelper.getOptionsForDeletableTexts(mParameters, contextsToDelete, resourceModel);
              options = [...options, ...optionsDeletableTexts];
            }
          }
          const commonBinding = (mParameters.selectedContexts ?? contextsToDelete)[0].getBinding();
          const inTreeTable = commonBinding.isA("sap.ui.model.odata.v4.ODataListBinding") && this.isListBindingHierarchical(commonBinding);

          // Content of Delete Dialog
          deleteHelper.updateContentForDeleteDialog(options, items);
          const fnConfirm = async () => {
            messageHandling.removeBoundTransitionMessages();
            this.busyLock(appComponent);
            try {
              await deleteHelper.deleteConfirmHandler(options, mParameters, messageHandler, resourceModel, appComponent, draftEnabled, inTreeTable);
              resolve();
            } catch (oError) {
              reject();
            } finally {
              this.busyUnlock(appComponent);
            }
          };
          const dialog = this.createDeleteDialog(items, mParameters, resourceModel, fnConfirm, reject);
          if (mParameters.noDialog) {
            fnConfirm();
          } else {
            dialog.addStyleClass("sapUiContentPadding");
            dialog.open();
          }
        } finally {
          // delete document unlock
          this.busyUnlock(appComponent);
        }
      });
    }

    /**
     * Create the confirmation dialog fo the deletion.
     *
     * @param items An array of controls used for the dialog content
     * @param parameters Contains the following attributes:
     * @param parameters.parentControl Parent control of the delete button if any
     * @param parameters.entitySetName Name of the current entitySet
     * @param resourceModel The resource model to load text resources
     * @param fnConfirm Function executed upon the validation of the deletion
     * @param fnReject Function executed if the dialog is closed via Cancel or Escape button
     * @returns The created delete confirmation dialog
     */;
    _proto.createDeleteDialog = function createDeleteDialog(items, parameters, resourceModel, fnConfirm, fnReject) {
      var _parameters$parentCon;
      let dialogConfirmed = false;
      const vBox = new VBox({
        items: items
      });
      const resourceBundleCore = Core.getLibraryResourceBundle("sap.fe.core");
      let title;
      if ((_parameters$parentCon = parameters.parentControl) !== null && _parameters$parentCon !== void 0 && _parameters$parentCon.isA("sap.ui.mdc.Table")) {
        title = resourceModel.getText("M_COMMON_TABLE_DELETE", undefined, parameters.entitySetName);
      } else {
        title = resourceBundleCore.getText("C_COMMON_DELETE");
      }
      const dialog = new Dialog({
        title: title,
        state: "Warning",
        content: [vBox],
        ariaLabelledBy: items,
        beginButton: new Button({
          text: title,
          type: "Emphasized",
          press: function () {
            dialogConfirmed = true;
            dialog.close();
            fnConfirm();
          }
        }),
        endButton: new Button({
          text: resourceModel.getText("C_COMMON_DIALOG_CANCEL"),
          press: function () {
            dialog.close();
          }
        }),
        afterClose: function () {
          dialog.destroy();
          // if dialog is closed unconfirmed (e.g. via "Cancel" or Escape button), ensure to reject promise
          if (!dialogConfirmed) {
            fnReject();
          }
        }
      });
      return dialog;
    }

    /**
     * Edits a document.
     *
     * @param oContext Context of the active document
     * @param oView Current view
     * @param appComponent The appComponent
     * @param messageHandler The message handler extension
     * @param groupId The batch groupId for post call of edit action
     * @returns Promise resolves with the new draft context in case of draft programming model
     * @final
     */;
    _proto.editDocument = async function editDocument(oContext, oView, appComponent, messageHandler, groupId) {
      const sProgrammingModel = this.getProgrammingModel(oContext);
      if (!oContext) {
        throw new Error("Binding context to active document is required");
      }
      if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
        throw new Error("Edit is only allowed for draft or sticky session supported services");
      }
      this.busyLock(appComponent);
      // before triggering the edit action we'll have to remove all bound transition messages
      messageHandler.removeTransitionMessages();
      try {
        const oNewContext = sProgrammingModel === ProgrammingModel.Draft ? await draft.createDraftFromActiveDocument(oContext, appComponent, {
          bPreserveChanges: true,
          oView: oView
        }, groupId) : await sticky.editDocumentInStickySession(oContext, appComponent);
        await messageHandler.showMessageDialog();
        return oNewContext;
      } catch (err) {
        await messageHandler.showMessages({
          concurrentEditFlag: true
        });
        throw err;
      } finally {
        this.busyUnlock(appComponent);
      }
    }

    /**
     * Cancel 'edit' mode of a document.
     *
     * @param oContext Context of the document to be canceled or deleted
     * @param [mInParameters] Optional, can contain the following attributes:
     * @param mInParameters.cancelButton Cancel Button of the discard popover (mandatory for now)
     * @param mInParameters.skipDiscardPopover Optional, supresses the discard popover incase of draft applications while navigating out of OP
     * @param appComponent The appComponent
     * @param resourceModel The model to load text resources
     * @param messageHandler The message handler extension
     * @param isNewObject True if we're trying to cancel a newly created object
     * @param isObjectModified True if the object has been modified by the user
     * @returns Promise resolves with ???
     * @final
     */;
    _proto.cancelDocument = async function cancelDocument(oContext, mInParameters, appComponent, resourceModel, messageHandler, isNewObject, isObjectModified) {
      //context must always be passed - mandatory parameter
      if (!oContext) {
        throw new Error("No context exists. Pass a meaningful context");
      }
      this.busyLock(appComponent);
      const mParameters = getParameters(mInParameters);
      const oModel = oContext.getModel();
      const sProgrammingModel = this.getProgrammingModel(oContext);
      if (sProgrammingModel !== ProgrammingModel.Draft && sProgrammingModel !== ProgrammingModel.Sticky) {
        throw new Error("Cancel document only allowed for draft or sticky session supported services");
      }
      try {
        let returnedValue = false;
        if (sProgrammingModel === ProgrammingModel.Draft && !isObjectModified) {
          const draftDataContext = oModel.bindContext(`${oContext.getPath()}/DraftAdministrativeData`).getBoundContext();
          const draftAdminData = await draftDataContext.requestObject();
          if (draftAdminData) {
            isObjectModified = draftAdminData.CreationDateTime !== draftAdminData.LastChangeDateTime;
          }
        }
        if (!mParameters.skipDiscardPopover) {
          await this._confirmDiscard(mParameters.cancelButton, isObjectModified, resourceModel);
        }
        if (oContext.isKeepAlive()) {
          // if the context is kept alive we set it again to detach the onBeforeDestroy callback and handle navigation here
          // the context needs to still be kept alive to be able to reset changes properly
          oContext.setKeepAlive(true, undefined);
        }
        if (mParameters.beforeCancelCallBack) {
          await mParameters.beforeCancelCallBack({
            context: oContext
          });
        }
        if (sProgrammingModel === ProgrammingModel.Draft) {
          if (isNewObject) {
            if (oContext.hasPendingChanges()) {
              oContext.getBinding().resetChanges();
            }
            returnedValue = await draft.deleteDraft(oContext, appComponent);
          } else {
            const oSiblingContext = oModel.bindContext(`${oContext.getPath()}/SiblingEntity`).getBoundContext();
            try {
              const sCanonicalPath = await oSiblingContext.requestCanonicalPath();
              if (oContext.hasPendingChanges()) {
                oContext.getBinding().resetChanges();
              }
              returnedValue = oModel.bindContext(sCanonicalPath).getBoundContext();
            } finally {
              await draft.deleteDraft(oContext, appComponent);
            }
          }
        } else {
          const discardedContext = await sticky.discardDocument(oContext);
          if (discardedContext) {
            if (discardedContext.hasPendingChanges()) {
              discardedContext.getBinding().resetChanges();
            }
            if (!isNewObject) {
              discardedContext.refresh();
              returnedValue = discardedContext;
            }
          }
        }

        // remove existing bound transition messages
        messageHandler.removeTransitionMessages();
        // show unbound messages
        await messageHandler.showMessages();
        return returnedValue;
      } catch (err) {
        await messageHandler.showMessages();
        throw err;
      } finally {
        this.busyUnlock(appComponent);
      }
    }

    /**
     * Saves the document.
     *
     * @param context Context of the document to be saved
     * @param appComponent The appComponent
     * @param resourceModel The model to load text resources
     * @param executeSideEffectsOnError True if we should execute side effects in case of an error
     * @param bindingsForSideEffects The listBindings to be used for executing side effects on error
     * @param messageHandler The message handler extension
     * @param isNewObject True if we're trying to cancel a newly created object
     * @returns Promise resolves with ???
     * @final
     */;
    _proto.saveDocument = async function saveDocument(context, appComponent, resourceModel, executeSideEffectsOnError, bindingsForSideEffects, messageHandler, isNewObject) {
      const sProgrammingModel = this.getProgrammingModel(context);
      if (sProgrammingModel !== ProgrammingModel.Sticky && sProgrammingModel !== ProgrammingModel.Draft) {
        throw new Error("Save is only allowed for draft or sticky session supported services");
      }
      try {
        this.busyLock(appComponent);
        const oActiveDocument = sProgrammingModel === ProgrammingModel.Draft ? await draft.activateDocument(context, appComponent, {}, messageHandler) : await sticky.activateDocument(context, appComponent);
        const messagesReceived = messageHandling.getMessages().concat(messageHandling.getMessages(true, true)); // get unbound and bound messages present in the model
        if (!(messagesReceived.length === 1 && messagesReceived[0].type === coreLibrary.MessageType.Success)) {
          // show our object creation toast only if it is not coming from backend
          MessageToast.show(isNewObject ? resourceModel.getText("C_TRANSACTION_HELPER_OBJECT_CREATED") : resourceModel.getText("C_TRANSACTION_HELPER_OBJECT_SAVED"));
        }
        return oActiveDocument;
      } catch (err) {
        if (executeSideEffectsOnError && (bindingsForSideEffects === null || bindingsForSideEffects === void 0 ? void 0 : bindingsForSideEffects.length) > 0) {
          /* The sideEffects are executed only for table items in transient state */
          bindingsForSideEffects.forEach(listBinding => {
            if (!CommonUtils.hasTransientContext(listBinding)) {
              appComponent.getSideEffectsService().requestSideEffectsForNavigationProperty(listBinding.getPath(), context);
            }
          });
        }
        await messageHandler.showMessages();
        throw err;
      } finally {
        this.busyUnlock(appComponent);
      }
    }

    /**
     * Calls a bound or unbound action.
     *
     * @param sActionName The name of the action to be called
     * @param [mParameters] Contains the following attributes:
     * @param [mParameters.parameterValues] A map of action parameter names and provided values
     * @param [mParameters.skipParameterDialog] Skips the parameter dialog if values are provided for all of them
     * @param [mParameters.contexts] Mandatory for a bound action: Either one context or an array with contexts for which the action is to be called
     * @param [mParameters.model] Mandatory for an unbound action: An instance of an OData V4 model
     * @param [mParameters.invocationGrouping] Mode how actions are to be called: 'ChangeSet' to put all action calls into one changeset, 'Isolated' to put them into separate changesets
     * @param [mParameters.label] A human-readable label for the action
     * @param [mParameters.bGetBoundContext] If specified, the action promise returns the bound context
     * @param oView Contains the object of the current view
     * @param appComponent The appComponent
     * @param messageHandler The message handler extension
     * @returns Promise resolves with an array of response objects (TODO: to be changed)
     * @final
     */;
    _proto.callAction = async function callAction(sActionName, mParameters, oView, appComponent, messageHandler, disableStrictHandling) {
      mParameters = getParameters(mParameters);
      let contextToProcess, oModel;
      const mBindingParameters = mParameters.bindingParameters;
      if (!sActionName) {
        throw new Error("Provide name of action to be executed");
      }
      // action imports are not directly obtained from the metaModel by it is present inside the entityContainer
      // and the acions it refers to present outside the entitycontainer, hence to obtain kind of the action
      // split() on its name was required
      const sName = sActionName.split("/")[1];
      sActionName = sName || sActionName;
      contextToProcess = sName ? undefined : mParameters.contexts;
      //checking whether the context is an array with more than 0 length or not an array(create action)
      if (contextToProcess && (Array.isArray(contextToProcess) && contextToProcess.length || !Array.isArray(contextToProcess))) {
        contextToProcess = Array.isArray(contextToProcess) ? contextToProcess[0] : contextToProcess;
        oModel = contextToProcess.getModel();
      }
      if (mParameters.model) {
        oModel = mParameters.model;
      }
      if (!oModel) {
        throw new Error("Pass a context for a bound action or pass the model for an unbound action");
      }
      // get the binding parameters $select and $expand for the side effect on this action
      // also gather additional property paths to be requested such as text associations
      const mSideEffectsParameters = appComponent.getSideEffectsService().getODataActionSideEffects(sActionName, contextToProcess) || {};
      try {
        let oResult;
        if (contextToProcess && oModel) {
          oResult = await operations.callBoundAction(sActionName, mParameters.contexts, oModel, appComponent, {
            parameterValues: mParameters.parameterValues,
            invocationGrouping: mParameters.invocationGrouping,
            label: mParameters.label,
            skipParameterDialog: mParameters.skipParameterDialog,
            mBindingParameters: mBindingParameters,
            entitySetName: mParameters.entitySetName,
            additionalSideEffect: mSideEffectsParameters,
            onSubmitted: () => {
              messageHandler === null || messageHandler === void 0 ? void 0 : messageHandler.removeTransitionMessages();
              this.busyLock(appComponent);
            },
            onResponse: () => {
              this.busyUnlock(appComponent);
            },
            parentControl: mParameters.parentControl,
            controlId: mParameters.controlId,
            internalModelContext: mParameters.internalModelContext,
            operationAvailableMap: mParameters.operationAvailableMap,
            bIsCreateAction: mParameters.bIsCreateAction,
            bGetBoundContext: mParameters.bGetBoundContext,
            bObjectPage: mParameters.bObjectPage,
            messageHandler: messageHandler,
            defaultValuesExtensionFunction: mParameters.defaultValuesExtensionFunction,
            selectedItems: mParameters.contexts,
            disableStrictHandling,
            groupId: mParameters.groupId
          });
        } else {
          oResult = await operations.callActionImport(sActionName, oModel, appComponent, {
            parameterValues: mParameters.parameterValues,
            label: mParameters.label,
            skipParameterDialog: mParameters.skipParameterDialog,
            bindingParameters: mBindingParameters,
            entitySetName: mParameters.entitySetName,
            onSubmitted: () => {
              this.busyLock(appComponent);
            },
            onResponse: () => {
              this.busyUnlock(appComponent);
            },
            parentControl: mParameters.parentControl,
            internalModelContext: mParameters.internalModelContext,
            operationAvailableMap: mParameters.operationAvailableMap,
            messageHandler: messageHandler,
            bObjectPage: mParameters.bObjectPage
          });
        }
        if (messageHandler) {
          await this._handleActionResponse(messageHandler, mParameters, sActionName);
        }
        return oResult;
      } catch (err) {
        if (messageHandler) {
          await this._handleActionResponse(messageHandler, mParameters, sActionName);
        }
        throw err;
      }
    }

    /**
     * Handles messages for action call.
     *
     * @param messageHandler The message handler extension
     * @param mParameters Parameters to be considered for the action.
     * @param sActionName The name of the action to be called
     * @returns Promise after message dialog is opened if required.
     * @final
     */;
    _proto._handleActionResponse = function _handleActionResponse(messageHandler, mParameters, sActionName) {
      const aTransientMessages = messageHandling.getMessages(true, true);
      const actionName = mParameters.label ? mParameters.label : sActionName;
      if (aTransientMessages.length > 0 && mParameters && mParameters.internalModelContext) {
        mParameters.internalModelContext.setProperty("sActionName", mParameters.label ? mParameters.label : sActionName);
      }
      let control;
      if (mParameters.controlId) {
        control = mParameters.parentControl.byId(mParameters.controlId);
      } else {
        control = mParameters.parentControl;
      }
      return messageHandler.showMessages({
        sActionName: actionName,
        control: control
      });
    }

    /**
     * Handles validation errors for the 'Discard' action.
     *
     * @final
     */;
    _proto.handleValidationError = function handleValidationError() {
      const oMessageManager = Core.getMessageManager(),
        errorToRemove = oMessageManager.getMessageModel().getData().filter(function (error) {
          // only needs to handle validation messages, technical and persistent errors needs not to be checked here.
          if (error.validation) {
            return error;
          }
        });
      oMessageManager.removeMessages(errorToRemove);
    }

    /**
     * Creates a new Popover. Factory method to make unit tests easier.
     *
     * @param settings Initial parameters for the popover
     * @returns A new Popover
     */;
    _proto._createPopover = function _createPopover(settings) {
      return new Popover(settings);
    }

    /**
     * Shows a popover to confirm discard if needed.
     *
     * @param cancelButton The control which will open the popover
     * @param isModified True if the object has been modified and a confirmation popover must be shown
     * @param resourceModel The model to load text resources
     * @returns Promise resolves if user confirms discard, rejects if otherwise, rejects if no control passed to open popover
     * @final
     */;
    _proto._confirmDiscard = function _confirmDiscard(cancelButton, isModified, resourceModel) {
      // If the data isn't modified, do not show any confirmation popover
      if (!isModified) {
        this.handleValidationError();
        return Promise.resolve();
      }
      cancelButton.setEnabled(false);
      return new Promise((resolve, reject) => {
        const confirmationPopover = this._createPopover({
          showHeader: false,
          placement: "Top"
        });
        confirmationPopover.addStyleClass("sapUiContentPadding");

        // Create the content of the popover
        const title = new Text({
          text: resourceModel.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_MESSAGE")
        });
        const confirmButton = new Button({
          text: resourceModel.getText("C_TRANSACTION_HELPER_DRAFT_DISCARD_BUTTON"),
          width: "100%",
          press: () => {
            this.handleValidationError();
            confirmationPopover.data("continueDiscard", true);
            confirmationPopover.close();
          }
        });
        confirmationPopover.addContent(new VBox({
          items: [title, confirmButton]
        }));

        // Attach handler
        confirmationPopover.attachBeforeOpen(() => {
          confirmationPopover.setInitialFocus(confirmButton);
        });
        confirmationPopover.attachAfterClose(() => {
          cancelButton.setEnabled(true);
          if (confirmationPopover.data("continueDiscard")) {
            resolve();
          } else {
            reject();
          }
        });
        confirmationPopover.openBy(cancelButton, false);
      });
    };
    _proto._launchDialogWithKeyFields = function _launchDialogWithKeyFields(oListBinding, mFields, oModel, mParameters, appComponent, messageHandler) {
      let oDialog;
      const oParentControl = mParameters.parentControl;

      // Crate a fake (transient) listBinding and context, just for the binding context of the dialog
      const oTransientListBinding = oModel.bindList(oListBinding.getPath(), oListBinding.getContext(), [], [], {
        $$updateGroupId: "submitLater"
      });
      oTransientListBinding.refreshInternal = function () {
        /* */
      };
      const oTransientContext = oTransientListBinding.create(mParameters.data, true);
      return new Promise(async (resolve, reject) => {
        const sFragmentName = "sap/fe/core/controls/NonComputedVisibleKeyFieldsDialog";
        const oFragment = XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment"),
          resourceModel = getResourceModel(oParentControl),
          oMetaModel = oModel.getMetaModel(),
          aImmutableFields = [],
          sPath = oListBinding.isRelative() ? oListBinding.getResolvedPath() : oListBinding.getPath(),
          oEntitySetContext = oMetaModel.createBindingContext(sPath),
          sMetaPath = oMetaModel.getMetaPath(sPath);
        for (const i in mFields) {
          aImmutableFields.push(oMetaModel.createBindingContext(`${sMetaPath}/${mFields[i]}`));
        }
        const oImmutableCtxModel = new JSONModel(aImmutableFields);
        const oImmutableCtx = oImmutableCtxModel.createBindingContext("/");
        const aRequiredProperties = getRequiredPropertiesFromInsertRestrictions(sMetaPath, oMetaModel);
        const oRequiredPropertyPathsCtxModel = new JSONModel(aRequiredProperties);
        const oRequiredPropertyPathsCtx = oRequiredPropertyPathsCtxModel.createBindingContext("/");
        const oNewFragment = await XMLPreprocessor.process(oFragment, {
          name: sFragmentName
        }, {
          bindingContexts: {
            entitySet: oEntitySetContext,
            fields: oImmutableCtx,
            requiredProperties: oRequiredPropertyPathsCtx
          },
          models: {
            entitySet: oEntitySetContext.getModel(),
            fields: oImmutableCtx.getModel(),
            metaModel: oMetaModel,
            requiredProperties: oRequiredPropertyPathsCtxModel
          }
        });
        let aFormElements = [];
        const mFieldValueMap = {};
        const messageManager = Core.getMessageManager();
        const _removeMessagesForActionParamter = messageControlId => {
          const allMessages = messageManager.getMessageModel().getData();
          // also remove messages assigned to inner controls, but avoid removing messages for different paramters (with name being substring of another parameter name)
          const relevantMessages = allMessages.filter(msg => msg.getControlIds().some(controlId => controlId.includes(messageControlId)));
          messageManager.removeMessages(relevantMessages);
        };
        let actionParameterInfos;
        const oController = {
          /*
          	fired on focus out from field or on selecting a value from the valuehelp.
          	the create button (Continue) is always enabled.
          	liveChange is not fired when value is added from valuehelp.
          	value validation is done for create button.
          */
          handleChange: async event => {
            const fieldId = event.getParameter("id");
            const field = event.getSource();
            const actionParameterInfo = actionParameterInfos.find(actionParameterInfo => actionParameterInfo.field === field);
            _removeMessagesForActionParamter(fieldId);
            actionParameterInfo.validationPromise = event.getParameter("promise");
            try {
              actionParameterInfo.value = await actionParameterInfo.validationPromise;
              actionParameterInfo.hasError = false;
            } catch (error) {
              delete actionParameterInfo.value;
              actionParameterInfo.hasError = true;
            }
          },
          /*
          	fired on key press. the create button the create button (Continue) is always enabled.
          	liveChange is not fired when value is added from valuehelp.
          	value validation is done for create button.
          */
          handleLiveChange: event => {
            const fieldId = event.getParameter("id");
            _removeMessagesForActionParamter(fieldId);
          }
        };
        const oDialogContent = await Fragment.load({
          definition: oNewFragment,
          controller: oController
        });
        let oResult;
        let isDialogConfirmed = false;
        oDialog = new Dialog(generate(["CreateDialog", sMetaPath]), {
          title: resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE"),
          content: [oDialogContent],
          beginButton: {
            text: resourceModel.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE_BUTTON"),
            type: "Emphasized",
            press: async _Event => {
              /* Validation of mandatory and value state for action parameters */
              if (!(await ActionRuntime.validateProperties(messageManager, actionParameterInfos, resourceModel))) {
                return;
              }
              BusyLocker.lock(oDialog);
              mParameters.bIsCreateDialog = true;
              try {
                const aValues = await Promise.all(Object.keys(mFieldValueMap).map(async function (sKey) {
                  const oValue = await mFieldValueMap[sKey];
                  const oDialogValue = {};
                  oDialogValue[sKey] = oValue;
                  return oDialogValue;
                }));
                if (mParameters.beforeCreateCallBack) {
                  await toES6Promise(mParameters.beforeCreateCallBack({
                    contextPath: oListBinding && oListBinding.getPath(),
                    createParameters: aValues
                  }));
                }
                const transientData = oTransientContext.getObject();
                const createData = {};
                Object.keys(transientData).forEach(function (sPropertyPath) {
                  const oProperty = oMetaModel.getObject(`${sMetaPath}/${sPropertyPath}`);
                  // ensure navigation properties are not part of the payload, deep create not supported
                  if (oProperty && oProperty.$kind === "NavigationProperty") {
                    return;
                  }
                  createData[sPropertyPath] = transientData[sPropertyPath];
                });
                const oNewDocumentContext = await this.createContext(oListBinding, createData, {
                  createAtEnd: !!mParameters.createAtEnd,
                  createInactive: !!mParameters.inactive,
                  parentContext: mParameters.parentContext
                });
                const oPromise = this.onAfterCreateCompletion(oListBinding, oNewDocumentContext, mParameters);
                let oResponse = await oPromise;
                if (!oResponse || oResponse && oResponse.bKeepDialogOpen !== true) {
                  oResponse = oResponse ?? {};
                  oDialog.setBindingContext(null);
                  oResponse.newContext = oNewDocumentContext;
                  isDialogConfirmed = true;
                  oResult = {
                    response: oResponse
                  };
                  oDialog.close();
                }
              } catch (oError) {
                // in case of creation failed, dialog should stay open - to achieve the same, nothing has to be done (like in case of success with bKeepDialogOpen)
                if (oError !== FELibrary.Constants.CreationFailed) {
                  // other errors are not expected
                  oResult = {
                    error: oError
                  };
                  oDialog.close();
                }
              } finally {
                BusyLocker.unlock(oDialog);
                messageHandler.showMessages();
              }
            }
          },
          endButton: {
            text: resourceModel.getText("C_COMMON_ACTION_PARAMETER_DIALOG_CANCEL"),
            press: function () {
              oResult = {
                error: FELibrary.Constants.CancelActionDialog
              };
              oDialog.close();
            }
          },
          beforeClose: function () {
            var _oDialog$getBindingCo;
            /* When the dialog is cancelled, messages need to be removed in case the same action should be executed again */
            for (const actionParameterInfo of actionParameterInfos) {
              const fieldId = actionParameterInfo.field.getId();
              _removeMessagesForActionParamter(fieldId);
            }
            // show footer as per UX guidelines when dialog is not open
            (_oDialog$getBindingCo = oDialog.getBindingContext("internal")) === null || _oDialog$getBindingCo === void 0 ? void 0 : _oDialog$getBindingCo.setProperty("isCreateDialogOpen", false);
            oDialog.destroy();
            oTransientListBinding.destroy();
            //rejected/resolved the promis returned by _launchDialogWithKeyFields
            //as soon as the dialog is closed. Without waiting for the dialog's
            //animation to finish
            if (isDialogConfirmed) {
              resolve(oResult.response);
            } else {
              var _oResult;
              reject(((_oResult = oResult) === null || _oResult === void 0 ? void 0 : _oResult.error) ?? FELibrary.Constants.CancelActionDialog);
            }
          }
        });
        aFormElements = oDialogContent === null || oDialogContent === void 0 ? void 0 : oDialogContent.getAggregation("form").getAggregation("formContainers")[0].getAggregation("formElements");
        if (oParentControl && oParentControl.addDependent) {
          // if there is a parent control specified add the dialog as dependent
          oParentControl.addDependent(oDialog);
        }
        oDialog.setBindingContext(oTransientContext);
        try {
          await CommonUtils.setUserDefaults(appComponent, aImmutableFields, oTransientContext, false, mParameters.createAction, mParameters.data);
          actionParameterInfos = aFormElements.map(parameterField => {
            const field = parameterField.getFields()[0];
            const isMultiValue = field.isA("sap.ui.mdc.MultiValueField");
            return {
              parameter: parameterField,
              isMultiValue: isMultiValue,
              field: field,
              value: isMultiValue ? field.getItems() : field.getValue(),
              validationPromise: undefined,
              hasError: false
            };
          });
          // footer must not be visible when the dialog is open as per UX guidelines
          oDialog.getBindingContext("internal").setProperty("isCreateDialogOpen", true);
          oDialog.open();
        } catch (oError) {
          await messageHandler.showMessages();
          throw oError;
        }
      });
    };
    _proto.onAfterCreateCompletion = function onAfterCreateCompletion(oListBinding, oNewDocumentContext, mParameters) {
      let fnResolve;
      const oPromise = new Promise(resolve => {
        fnResolve = resolve;
      });
      const fnCreateCompleted = oEvent => {
        const oContext = oEvent.getParameter("context"),
          bSuccess = oEvent.getParameter("success");
        if (oContext === oNewDocumentContext) {
          oListBinding.detachCreateCompleted(fnCreateCompleted, this);
          fnResolve(bSuccess);
        }
      };
      const fnSafeContextCreated = () => {
        oNewDocumentContext.created().then(undefined, function () {
          Log.trace("transient creation context deleted");
        }).catch(function (contextError) {
          Log.trace("transient creation context deletion error", contextError);
        });
      };
      oListBinding.attachCreateCompleted(fnCreateCompleted, this);
      return oPromise.then(bSuccess => {
        if (!bSuccess) {
          if (!mParameters.keepTransientContextOnFailed) {
            // Cancel the pending POST and delete the context in the listBinding
            fnSafeContextCreated(); // To avoid a 'request cancelled' error in the console
            oListBinding.resetChanges();
            oListBinding.getModel().resetChanges(oListBinding.getUpdateGroupId());
            throw FELibrary.Constants.CreationFailed;
          }
          return {
            bKeepDialogOpen: true
          };
        } else {
          return oNewDocumentContext.created();
        }
      });
    }

    /**
     * Retrieves the name of the NewAction to be executed.
     *
     * @param oStartupParameters Startup parameters of the application
     * @param sCreateHash Hash to be checked for action type
     * @param oMetaModel The MetaModel used to check for NewAction parameter
     * @param sMetaPath The MetaPath
     * @returns The name of the action
     * @final
     */;
    _proto._getNewAction = function _getNewAction(oStartupParameters, sCreateHash, oMetaModel, sMetaPath) {
      let sNewAction;
      if (oStartupParameters && oStartupParameters.preferredMode && sCreateHash.toUpperCase().includes("I-ACTION=CREATEWITH")) {
        const sPreferredMode = oStartupParameters.preferredMode[0];
        sNewAction = sPreferredMode.toUpperCase().indexOf("CREATEWITH:") > -1 ? sPreferredMode.substr(sPreferredMode.lastIndexOf(":") + 1) : undefined;
      } else if (oStartupParameters && oStartupParameters.preferredMode && sCreateHash.toUpperCase().includes("I-ACTION=AUTOCREATEWITH")) {
        const sPreferredMode = oStartupParameters.preferredMode[0];
        sNewAction = sPreferredMode.toUpperCase().indexOf("AUTOCREATEWITH:") > -1 ? sPreferredMode.substr(sPreferredMode.lastIndexOf(":") + 1) : undefined;
      } else {
        sNewAction = oMetaModel && oMetaModel.getObject !== undefined ? oMetaModel.getObject(`${sMetaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/NewAction`) || oMetaModel.getObject(`${sMetaPath}@com.sap.vocabularies.Common.v1.DraftRoot/NewAction`) : undefined;
      }
      return sNewAction;
    }

    /**
     * Retrieves the label for the title of a specific create action dialog, e.g. Create Sales Order from Quotation.
     *
     * The following priority is applied:
     * 1. label of line-item annotation.
     * 2. label annotated in the action.
     * 3. "Create" as a constant from i18n.
     *
     * @param oMetaModel The MetaModel used to check for the NewAction parameter
     * @param sMetaPath The MetaPath
     * @param sNewAction Contains the name of the action to be executed
     * @param oResourceBundleCore ResourceBundle to access the default Create label
     * @returns The label for the Create Action Dialog
     * @final
     */;
    _proto._getSpecificCreateActionDialogLabel = function _getSpecificCreateActionDialogLabel(oMetaModel, sMetaPath, sNewAction, oResourceBundleCore) {
      var _lineItems$find;
      const lineItems = oMetaModel === null || oMetaModel === void 0 ? void 0 : oMetaModel.getObject(`${sMetaPath}/@com.sap.vocabularies.UI.v1.LineItem`);
      const label = lineItems === null || lineItems === void 0 ? void 0 : (_lineItems$find = lineItems.find(lineItem => isDataFieldForAction(lineItem) && lineItem.Action.split("(", 1)[0] === sNewAction)) === null || _lineItems$find === void 0 ? void 0 : _lineItems$find.Label;
      return label || (oMetaModel === null || oMetaModel === void 0 ? void 0 : oMetaModel.getObject(`${sMetaPath}/${sNewAction}@com.sap.vocabularies.Common.v1.Label`)) || (oResourceBundleCore === null || oResourceBundleCore === void 0 ? void 0 : oResourceBundleCore.getText("C_TRANSACTION_HELPER_SAPFE_ACTION_CREATE"));
    };
    return TransactionHelper;
  }();
  const singleton = new TransactionHelper();
  return singleton;
}, false);
