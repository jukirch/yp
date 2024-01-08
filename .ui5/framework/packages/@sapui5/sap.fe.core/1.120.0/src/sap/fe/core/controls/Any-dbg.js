/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/base/ManagedObject"], function (ManagedObject) {
  "use strict";

  /**
   * A custom element to evaluate the value of Binding.
   *
   * @hideconstructor
   */
  const Any = ManagedObject.extend("sap.fe.core.controls.Any", {
    metadata: {
      properties: {
        any: "any",
        anyText: "string",
        anyBoolean: "boolean"
      }
    },
    updateProperty: function (sName) {
      // Avoid Promise processing in ManagedObject and set Promise as value directly
      if (sName === "any") {
        this.setAny(this.getBindingInfo(sName).binding.getExternalValue());
      } else {
        this.setAnyText(this.getBindingInfo(sName).binding.getExternalValue());
      }
    }
  });
  return Any;
}, false);
