/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["../field/FieldRuntime"], function (FieldRuntime) {
  "use strict";

  const multiValueFieldRuntime = {
    /**
     * Handler for the change event.
     *
     * Used to request SideEffects based on the validity of change.
     *
     * @param controller The controller of the page containing the field
     * @param event The event object passed by the change event
     */
    handleChange: function (controller, event) {
      const sourcefield = event.getSource(),
        isTransient = sourcefield.getBindingContext().isTransient(),
        isValueResolved = event.getParameter("promise") || Promise.resolve();

      // Use the FE Controller instead of the extensionAPI to access internal FE controllers
      const feController = FieldRuntime._getExtensionController(controller);
      feController.editFlow.syncTask(isValueResolved);

      // if the context is transient, it means the request would fail anyway as the record does not exist in reality
      if (isTransient) {
        return;
      }

      // register the change coming in this multi value field as successful (for group SideEffects)
      // immediate SideEffects will be handled by create/delete handlers
      feController._sideEffects.prepareSideEffectsForField(event, true, isValueResolved);
    },
    /**
     * Handler for the validateFieldGroup event.
     *
     * @param controller The controller of the page containing the field
     * @param event The event object passed by the validateFieldGroup event
     */
    onValidateFieldGroup: async function (controller, event) {
      const feController = FieldRuntime._getExtensionController(controller);
      await feController._sideEffects.handleFieldGroupChange(event);
    }
  };
  return multiValueFieldRuntime;
}, false);
