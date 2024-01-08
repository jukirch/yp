// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  ["../Category"],
  function (Category) {
    "use strict";
    var Workpage = Category.extend(
      "sap.ushell.components.cepsearchresult.app.util.controls.categories.Workpage", /** @lends sap.ushell.components.cepsearchresult.app.util.controls.categories.Workpage.prototype */ {
        renderer: Category.getMetadata().getRenderer()
      }
    );

    Workpage.prototype.getViewSettings = function () {
      return {
        views: [
          {
            key: "list",
            icon: "sap-icon://text-align-justified"
          }
        ],
        default: "list"
      };
    };

    Workpage.prototype.getItemAvatarSettings = function () {
      return Category.prototype.getItemAvatarSettings.apply(this, ["{data>icon}"]);
    };

    return Workpage;
  });
