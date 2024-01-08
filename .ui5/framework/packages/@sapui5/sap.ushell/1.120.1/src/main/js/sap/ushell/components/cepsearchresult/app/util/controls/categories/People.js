// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  ["../Category",
    "sap/m/CustomListItem",
    "sap/m/Link",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/FlexBox",
    "sap/m/Avatar",
    "sap/m/ObjectIdentifier",
    "sap/ui/core/CustomData"
  ],
  function (
    Category,
    CustomListItem,
    Link,
    Text,
    Label,
    FlexBox,
    Avatar,
    ObjectIdentifier,
    CustomData

  ) {
    "use strict";
    var People = Category.extend(
      "sap.ushell.components.cepsearchresult.app.util.controls.categories.People", /** @lends sap.ushell.components.cepsearchresult.app.util.controls.categories.People.prototype */ {
        renderer: Category.getMetadata().getRenderer()
      }
    );

    People.prototype.getItemAvatarSettings = function () {
      var oAvatarSettings = Category.prototype.getItemAvatarSettings.apply(this, ["{data>icon}"]);
      oAvatarSettings.initials = {
        path: "data>text",
        formatter: function (oData) {
          try {
            var aTexts = oData.split(" ");
            return (aTexts[0].charAt(0) + aTexts[aTexts.length - 1].charAt(0)).toUpperCase();
          } catch (ex) {
            return "";
          }
        }
      };
      return oAvatarSettings;
    };

    People.prototype.createDefaultItemTemplate = function () {
      return new Category.CustomListItem({
        press: this.itemNavigate.bind(this),
        type: "Active",
        content: [
          new FlexBox({
            direction: "Column",
            customData: new CustomData({
              key: "status",
              value: "{= ${data>status} || 'unknown'}",
              writeToDom: true
            }),
            items: [
              new FlexBox({
                direction: "Row",
                wrap: "Wrap",
                items: [
                  new Avatar(this.getItemAvatarSettings())
                    .addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginBottom people"),
                  new ObjectIdentifier({
                    text: "{data>description}",
                    title: "{data>text}",
                    titleActive: "{= !!${data>_navigation} || !!${data>url}}",
                    titlePress: this.itemNavigate.bind(this)
                  }).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginBottom"),
                  new FlexBox({
                    direction: "Column",
                    items: [
                      this.createInfoRow("Office", "{data>location}"),
                      this.createInfoRow("Manager", "{data>manager}", "mailto:{data>manager}")
                    ]
                  }).addStyleClass("infoTextSection"),
                  new FlexBox({
                    direction: "Column",
                    items: [
                      this.createInfoRow("Mail", "{data>mail}", "mailto:{data>mail}"),
                      this.createInfoRow("Mobile", "{data>mobile}", "tel:{data>mobile}"),
                      this.createInfoRow("Work", "{data>work}", "tel:{data>work}")
                    ]
                  }).addStyleClass("infoTextSection")
                ]
              }).addStyleClass("sapUiSmallMarginEnd")
            ]
          }).addStyleClass("status")
        ]
      });
    };

    People.prototype.createInfoRow = function (sLabel, sDataPath, sUrlPath) {
      return new FlexBox({
        direction: "Row",
        visible: "{= !!$" + sDataPath + "}",
        items: [
          new Label({
            text: sLabel,
            width: "3rem"
          }).addStyleClass("sapUiSmallMarginBegin"),
          sUrlPath ?
            new Link({
              text: sDataPath,
              href: sUrlPath
            }).addStyleClass("sapUiSmallMarginBeginEnd")
            :
            new Text({
              text: sDataPath
            }).addStyleClass("sapUiSmallMarginBeginEnd")
        ]
      }).addStyleClass("tinyTop");
    };

    People.prototype.getPlaceholderData = function () {
      return {
        text: new Array(20).join("\u00A0"),
        description: new Array(14).join("\u00A0"),
        mail: new Array(25).join("\u00A0"),
        location: new Array(7).join("\u00A0"),
        mobile: new Array(17).join("\u00A0"),
        status: "offline",
        icon: "sap-icon://person-placeholder"
      };
    };
    return People;
  });
