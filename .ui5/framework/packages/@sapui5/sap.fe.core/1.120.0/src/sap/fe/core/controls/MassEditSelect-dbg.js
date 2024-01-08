/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2023 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Select", "sap/m/SelectRenderer"], function (Select, SelectRenderer) {
  "use strict";

  const MassEditSelect = Select.extend("sap.fe.core.controls.MassEditSelect", {
    metadata: {
      properties: {
        showValueHelp: {
          type: "boolean"
        },
        valueHelpIconSrc: {
          type: "string"
        },
        selectValue: {
          type: "string"
        }
      },
      events: {
        valueHelpRequest: {}
      },
      interfaces: ["sap.ui.core.IFormContent"]
    },
    renderer: {
      apiVersion: 2,
      render: SelectRenderer.render
    }
  });
  return MassEditSelect;
}, false);
