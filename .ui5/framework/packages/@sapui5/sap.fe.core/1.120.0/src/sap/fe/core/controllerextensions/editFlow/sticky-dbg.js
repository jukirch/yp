/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/library", "sap/m/MessageBox", "sap/ui/core/Core", "../../operationsHelper"], function (Log, ResourceModelHelper, FELibrary, MessageBox, Core, operationsHelper) {
  "use strict";

  var getResourceModel = ResourceModelHelper.getResourceModel;
  const ProgrammingModel = FELibrary.ProgrammingModel;
  /**
   * Opens a sticky session to edit a document.
   *
   * @param context Context of the document to be edited
   * @param appComponent The AppComponent
   * @returns A Promise resolved when the sticky session is in edit mode
   */
  async function editDocumentInStickySession(context, appComponent) {
    const model = context.getModel(),
      metaModel = model.getMetaModel(),
      metaPath = metaModel.getMetaPath(context.getPath()),
      editActionAnnotation = metaModel.getObject(`${metaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/EditAction`);
    if (!editActionAnnotation) {
      throw new Error(`Edit Action for Sticky Session not found for ${metaPath}`);
    }
    const resourceModel = getResourceModel(appComponent);
    const actionName = resourceModel.getText("C_COMMON_OBJECT_PAGE_EDIT");
    const editAction = model.bindContext(`${editActionAnnotation}(...)`, context, {
      $$inheritExpandSelect: true
    });
    const groupId = "direct";
    const editPromise = editAction.execute(groupId, undefined, operationsHelper.fnOnStrictHandlingFailed.bind(sticky, groupId, {
      label: actionName,
      model
    }, resourceModel, null, null, null, undefined, undefined));
    model.submitBatch(groupId);
    const newContext = await editPromise;
    const sideEffects = appComponent.getSideEffectsService().getODataActionSideEffects(editActionAnnotation, newContext);
    if (sideEffects !== null && sideEffects !== void 0 && sideEffects.triggerActions && sideEffects.triggerActions.length) {
      await appComponent.getSideEffectsService().requestSideEffectsForODataAction(sideEffects, newContext);
    }
    return newContext;
  }
  /**
   * Activates a document and closes the sticky session.
   *
   * @param context Context of the document to be activated
   * @param appComponent Context of the document to be activated
   * @returns A promise resolve when the sticky session is activated
   */
  async function activateDocument(context, appComponent) {
    const model = context.getModel(),
      metaModel = model.getMetaModel(),
      metaPath = metaModel.getMetaPath(context.getPath()),
      saveActionAnnotation = metaModel.getObject(`${metaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/SaveAction`);
    if (!saveActionAnnotation) {
      throw new Error(`Save Action for Sticky Session not found for ${metaPath}`);
    }
    const resourceModel = getResourceModel(appComponent);
    const actionName = resourceModel.getText("C_OP_OBJECT_PAGE_SAVE");
    const saveAction = model.bindContext(`${saveActionAnnotation}(...)`, context, {
      $$inheritExpandSelect: true
    });
    const groupId = "direct";
    const savePromise = saveAction.execute(groupId, undefined, operationsHelper.fnOnStrictHandlingFailed.bind(sticky, groupId, {
      label: actionName,
      model
    }, resourceModel, null, null, null, undefined, undefined));
    model.submitBatch(groupId);
    try {
      return await savePromise;
    } catch (err) {
      const messagesPath = metaModel.getObject(`${metaPath}/@${"com.sap.vocabularies.Common.v1.Messages"}/$Path`);
      if (messagesPath) {
        try {
          await appComponent.getSideEffectsService().requestSideEffects([messagesPath], context);
        } catch (error) {
          Log.error("Error while requesting side effects", error);
        }
      }
      throw err;
    }
  }
  /**
   * Discards a document and closes sticky session.
   *
   * @param context Context of the document to be discarded
   * @returns A promise resolved when the document is dicarded
   */
  function discardDocument(context) {
    const model = context.getModel(),
      metaModel = model.getMetaModel(),
      metaPath = metaModel.getMetaPath(context.getPath()),
      discardActionAnnotation = metaModel.getObject(`${metaPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/DiscardAction`);
    if (!discardActionAnnotation) {
      throw new Error(`Discard Action for Sticky Session not found for ${metaPath}`);
    }
    const discardAction = model.bindContext(`/${discardActionAnnotation}(...)`);
    return discardAction.execute("$direct").then(function () {
      return context;
    });
  }

  /**
   * Process the Data loss confirmation.
   *
   * @param fnProcess Function to execute after confirmation
   * @param view Current view
   * @param programmingModel Programming Model of the current page
   * @returns `void` i think
   */
  function processDataLossConfirmation(fnProcess, view, programmingModel) {
    const uiEditable = view.getModel("ui").getProperty("/isEditable"),
      resourceBundle = Core.getLibraryResourceBundle("sap.fe.templates"),
      warningMsg = resourceBundle && resourceBundle.getText("T_COMMON_UTILS_NAVIGATION_AWAY_MSG"),
      confirmButtonTxt = resourceBundle && resourceBundle.getText("T_COMMON_UTILS_NAVIGATION_AWAY_CONFIRM_BUTTON"),
      cancelButtonTxt = resourceBundle && resourceBundle.getText("T_COMMON_UTILS_NAVIGATION_AWAY_CANCEL_BUTTON");
    if (programmingModel === ProgrammingModel.Sticky && uiEditable) {
      return MessageBox.warning(warningMsg, {
        actions: [confirmButtonTxt, cancelButtonTxt],
        emphasizedAction: confirmButtonTxt,
        onClose: function (actionText) {
          if (actionText === confirmButtonTxt) {
            Log.info("Navigation confirmed.");
            fnProcess();
          } else {
            Log.info("Navigation rejected.");
          }
        }
      });
    }
    return fnProcess();
  }

  /**
   * Static functions for the sticky session programming model
   *
   * @namespace
   * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
   * @since 1.54.0
   */
  const sticky = {
    editDocumentInStickySession: editDocumentInStickySession,
    activateDocument: activateDocument,
    discardDocument: discardDocument,
    processDataLossConfirmation: processDataLossConfirmation
  };
  return sticky;
}, false);
