// Copyright (c) 2009-2023 SAP SE, All Rights Reserved

sap.ui.define(
  ["../Category",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/FlexBox",
    "sap/m/Avatar",
    "sap/m/ObjectIdentifier",
    "sap/ui/core/Core",
    "sap/ui/core/theming/Parameters",
    "sap/ui/core/format/DateFormat"
  ],
  function (
    Category,
    Text,
    Label,
    FlexBox,
    Avatar,
    ObjectIdentifier,
    Core,
    ThemeParameters,
    DateFormat
  ) {
    "use strict";

    var mParams = {};
    function getThemeParameters () {
      mParams = ThemeParameters.get({
        name: [
          "sapUiAccent2",
          "sapUiAccentBackgroundColor2",
          "sapUiAccent10",
          "sapUiAccentBackgroundColor10",
          "sapUiFontFamily"]
      });
    }
    Core.attachThemeChanged(getThemeParameters);
    getThemeParameters();


    function formatDate (oFormat, oDate) {
      if (typeof oDate === "string") {
        oDate = new Date(oDate);
      }
      if (!(oDate instanceof Date)) {
        return "";
      }
      if (oDate.toString() === "Invalid Date") {
        return "";
      }
      if (!oFormat) {
        oFormat = { style: "short" };
      }
      return DateFormat.getDateInstance(oFormat).format(oDate);
    }

    function formatTime (oFormat, oDate) {
      if (typeof oDate === "string") {
        oDate = new Date(oDate);
      }
      if (!(oDate instanceof Date)) {
        return "";
      }
      if (oDate.toString() === "Invalid Date") {
        return "";
      }
      if (!oFormat) {
        oFormat = { style: "short" };
      }
      return DateFormat.getDateTimeInstance(oFormat).format(oDate);
    }

    var sCalendarSvg = [
      '<svg xmlns="http://www.w3.org/2000/svg" aria-label="Calendar" role="img" viewBox="0 0 100 100">',
      '<rect width="100" height="39" fill="{mParams.sapUiAccent2}"/>',
      '<rect y="39" width="100" height="61" fill="{mParams.sapUiAccentBackgroundColor10}"/>',
      '<text x="50%" y="29" style=\'fill:{mParams.sapUiAccentBackgroundColor2};font-size:23px;opacity:0.8;font-family:{mParams.sapUiFontFamily};text-anchor: middle\'>{sMonth}</text>',
      '<text id="day" x="50%" y="84"',
      " style='stroke-width:1;stroke:{mParams.sapUiAccentBackgroundColor10};",
      " fill: {mParams.sapUiAccent10}; font-size: 45px; font-weight: bold; font-family:{mParams.sapUiFontFamily};text-anchor: middle'>{sDay}</text>",
      '<text id="weekday" x="20" y="70" style=\'display:none;fill:{mParams.sapUiAccent10};font-size:20px;font-family:{mParams.sapUiFontFamily};text-anchor: middle\'>{sWeekday}</text>',
      "</svg >"].join("");

    function createCalendarSvg (sWeekday, sMonth, sDay) {
      var sResultSvg = sCalendarSvg.replace("{sMonth}", sMonth.substring(0, 3))
        .replace("{sDay}", sDay)
        .replace("{sWeekday}", sWeekday.substring(0, 2))
        .replace(/\{mParams.sapUiAccentBackgroundColor2\}/g, mParams.sapUiAccentBackgroundColor2)
        .replace(/\{mParams.sapUiAccentBackgroundColor10\}/g, mParams.sapUiAccentBackgroundColor10)
        .replace(/\{mParams.sapUiAccent2\}/g, mParams.sapUiAccent2)
        .replace(/\{mParams.sapUiAccent10\}/g, mParams.sapUiAccent10)
        .replace(/\{mParams.sapUiFontFamily\}/g, mParams.sapUiFontFamily);
      return "data:image/svg+xml;base64," + btoa(sResultSvg);
    }

    var Event = Category.extend(
      "sap.ushell.components.cepsearchresult.app.util.controls.categories.Event", /** @lends sap.ushell.components.cepsearchresult.app.util.controls.categories.Event.prototype */ {
      renderer: Category.getMetadata().getRenderer()
    }
    );

    Event.prototype.getItemAvatarSettings = function () {
      var oAvatarSettings = Category.prototype.getItemAvatarSettings.apply(this, ["{data>icon}"]);
      oAvatarSettings.src = {
        path: "data>",
        formatter: function (oData) {
          if (!oData) {
            return "";
          }
          return createCalendarSvg(
            formatDate({ format: "EEE" }, oData.from),
            formatDate({ format: "MMM" }, oData.from),
            formatDate({ format: "D" }, oData.from)
          );
        }
      };
      return oAvatarSettings;
    };

    Event.prototype.createDefaultItemTemplate = function () {
      return new Category.CustomListItem({
        press: this.itemNavigate.bind(this),
        type: "Active",
        content: [
          new FlexBox({
            direction: "Column",
            items: [
              new FlexBox({
                direction: "Row",
                wrap: "Wrap",
                items: [
                  new Avatar(this.getItemAvatarSettings())
                    .addStyleClass("sapUiSmallMarginBegin sapUiTinyMarginBottom event"),
                  new ObjectIdentifier({
                    text: "{data>description}",
                    title: "{data>title}",
                    titleActive: "{= !!${data>_navigation} || !!${data>url}}",
                    titlePress: this.itemNavigate.bind(this)
                  }).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginBottom"),
                  new FlexBox({
                    direction: "Column",
                    items: [
                      this.createDateRow(
                        "From", "data>from"
                      ),
                      this.createDateRow(
                        "To", "data>to"
                      )
                    ]
                  }).addStyleClass("infoTextSection")
                ]
              }).addStyleClass("sapUiSmallMarginEnd")
            ]
          }).addStyleClass("status")
        ]
      });
    };

    Event.prototype.createDateRow = function (sLabel, sPath) {
      var oDate = { path: sPath, formatter: formatDate.bind(null, { style: "medium" }) },
        oTime = { path: sPath, formatter: formatTime.bind(null, { pattern: "hh:mm" }) };
      return new FlexBox({
        direction: "Row",
        items: [
          new Label({
            text: sLabel,
            width: "3rem"
          }).addStyleClass("sapUiSmallMarginBegin"),
          new Text({
            text: oDate,
            width: "6rem"
          }).addStyleClass("sapUiSmallMarginBeginEnd"),
          new Text({
            text: oTime,
            width: "4rem"
          }).addStyleClass("sapUiSmallMarginBeginEnd")
        ]
      }).addStyleClass("tinyTop");
    };

    return Event;
  });
