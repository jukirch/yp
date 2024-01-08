// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ushell/components/cepsearchresult/app/util/appendStyleVars",
  "./util/Edition"
], function (UIComponent, appendStyleVars) {
  "use strict";

  appendStyleVars([
    "_sap_m_IconTabBar_ShellHeaderShadow",
    "sapUiElementLineHeight",
    "_sap_m_IconTabBar_HeaderBorderBottom",
    "_sap_m_IconTabBar_HeaderBackground"
  ]);

  /**
   * Component of the Search Result Application.
   *
   * @param {string} sId Component id
   * @param {object} oParams Component parameter
   *
   * @class
   * @extends sap.ui.core.UIComponent
   *
   * @private
   *
   * @since 1.110.0
   * @alias sap.ushell.components.cepsearchresult.app.Component
   */
  return UIComponent.extend("sap.ushell.components.cepsearchresult.app.Component", /** @lends sap.ushell.components.cepsearchresult.app.Component */{
    metadata: {
      manifest: "json"
    }
  });
});
