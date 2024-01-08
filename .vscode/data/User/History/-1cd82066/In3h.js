sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/dom/includeStylesheet",
    "sap/m/MessageToast",
    "sap/ui/core/Icon",
    "sap/m/Text"
],

    function (Control, includeStyleSheet, MessageToast, Icon, Text) {
        "use strict";

        return Control.extend("s330601.FlightConnElement.js", {
            metadata: {
                properties: {
                    width: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    },
                    height: {
                        type: "sap.ui.core.CSSSize",
                        defaultValue: "auto"
                    }
                },
                aggregations: {
                    _icon: {
                        type: "sap.ui.core.Icon",
                        multiple: false,
                        visibility: "hidden"
                    },
                    _connection: {
                        type: "sap.m.Text",
                        multiple: false,
                        visibility: "hidden"
                    }
                },
                defaultAggregation: "content",
                events: {
                    "iconPress": {
                        parameters: {
                            value: {
                                type: "string"
                            }
                        }
                    }
                }
            },

            init: function () {

                includeStyleSheet("/css/cust.css");

                var oIcon = new Icon({ src: "sap-icon://flight", id: "idIcon" });
                var oText = new Text({ text: "Aus Element!", id: "idText" });
                this.setAggregation("_icon", oIcon);
                this.setAggregation("_connection", oText);

            },

            renderer: function (oRm, oControl) {

                var sWidth = oControl.getWidth();
                var sHeight = oControl.getHeight();
                var sStyleInfo = "style=\"width: " + sWidth + "; height: " + sHeight + ";\"";

                oRm.write("<div " + sStyleInfo);
                oRm.addClass("custFlightConnections");
                oRm.writeClasses(oControl);
                oRm.writeControlData(oControl);
                oRm.write(">");
                oRm.renderControl(oControl.getAggregation("_icon"));
                oRm.renderControl(oControl.getAggregation("_connection"));

                oRm.write("</div>")

            },

            onAfterRendering: function () {
                if (sap.ui.core.Control.prototype.onAfterRendering) {
                    sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments);
                }
                this.attachIconPress(this.onIconPress);
            },

            onIconPress: function (oEvent) {
                var sString = oEvent.getParameter("value");
                MessageToast.show(sString);
            },

            onclick: function () {
                this.fireIconPress({ "value": "Flugzeug Icon" });
            }

        });
    });
